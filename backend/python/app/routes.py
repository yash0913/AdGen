import io
import logging
from fastapi import APIRouter, HTTPException, File, UploadFile, Form, Depends
from fastapi.responses import JSONResponse
from PIL import Image
from typing import Optional

from .schemas import (
    GenerateRequest, 
    GenerateResponse, 
    ErrorResponse, 
    HealthResponse,
    TrendProfileData,
    LegacyGenerateRequest
)
from .generator import SDXLGenerator
from .utils import validate_image_format

logger = logging.getLogger(__name__)

# Initialize router first
router = APIRouter()

# Global generator instance
_generator: Optional[SDXLGenerator] = None

def get_generator() -> SDXLGenerator:
    """Get or create the global SDXL generator instance"""
    global _generator
    if _generator is None:
        logger.info("Creating SDXL Generator instance...")
        _generator = SDXLGenerator()
        # Initialize in background or on first use
    return _generator

@router.get("/health", response_model=HealthResponse)
def health():
    """Health check endpoint with generator status"""
    try:
        generator = get_generator()
        
        response_data = {
            "status": "ok",
            "generator_ready": generator.is_ready(),
            "memory_info": generator.get_memory_usage()
        }
        
        return HealthResponse(**response_data)
        
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return HealthResponse(
            status="error", 
            generator_ready=False,
            memory_info={"error": str(e)}
        )

@router.post("/generate", response_model=GenerateResponse)
async def generate(
    product_image: UploadFile = File(..., description="Product image file"),
    industry: str = Form(..., description="Industry category"),
    platform: str = Form(..., description="Target platform"),
    trend_profile: str = Form(..., description="JSON string of TrendProfile data"),
    brand_name: Optional[str] = Form("", description="Brand name"),
    headline: Optional[str] = Form("", description="Headline"),
    num_images: Optional[int] = Form(4, description="Number of images (3-5)"),
    num_inference_steps: Optional[int] = Form(30, description="Inference steps"),
    guidance_scale: Optional[float] = Form(7.5, description="Guidance scale"),
    controlnet_conditioning_scale: Optional[float] = Form(1.0, description="ControlNet scale"),
    base_seed: Optional[int] = Form(None, description="Base seed")
):
    """
    Generate ad creatives using SDXL and ControlNet
    
    This endpoint accepts a product image and trend profile data,
    then generates 3-5 ad variations using Stable Diffusion XL.
    """
    request_id = None
    
    try:
        # Validate and parse inputs
        if not product_image.content_type or not product_image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Invalid image format")
        
        # Read and validate image
        image_data = await product_image.read()
        if not validate_image_format(image_data):
            raise HTTPException(status_code=400, detail="Unsupported image format")
        
        # Parse image
        try:
            pil_image = Image.open(io.BytesIO(image_data))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Could not process image: {str(e)}")
        
        # Parse trend profile JSON
        try:
            import json
            trend_profile_dict = json.loads(trend_profile)
            trend_profile_data = TrendProfileData(**trend_profile_dict)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid trend profile JSON")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid trend profile data: {str(e)}")
        
        # Validate parameters
        num_images = max(3, min(5, num_images or 4))
        num_inference_steps = max(10, min(50, num_inference_steps or 30))
        guidance_scale = max(1.0, min(20.0, guidance_scale or 7.5))
        controlnet_conditioning_scale = max(0.1, min(2.0, controlnet_conditioning_scale or 1.0))
        
        # Get generator and ensure it's initialized
        generator = get_generator()
        if not generator.is_ready():
            logger.info("Initializing generator for first use...")
            if not generator.initialize():
                raise HTTPException(status_code=503, detail="Generator initialization failed")
        
        # Generate ads
        logger.info(f"Starting ad generation for {industry}/{platform}")
        
        result = generator.generate_ads(
            product_image=pil_image,
            trend_profile=trend_profile_data.dict(),
            brand_name=brand_name or "",
            headline=headline or "",
            num_images=num_images,
            num_inference_steps=num_inference_steps,
            guidance_scale=guidance_scale,
            controlnet_conditioning_scale=controlnet_conditioning_scale,
            base_seed=base_seed
        )
        
        request_id = result["requestId"]
        logger.info(f"Ad generation completed: {request_id}")
        
        return GenerateResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Generation error (request: {request_id}): {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Generation failed: {str(e)}"
        )

@router.post("/initialize")
def initialize_generator():
    """Manually initialize the generator (useful for warming up)"""
    try:
        generator = get_generator()
        if generator.is_ready():
            return {"status": "already_initialized", "ready": True}
        
        logger.info("Manual generator initialization requested")
        success = generator.initialize()
        
        return {
            "status": "success" if success else "failed",
            "ready": generator.is_ready(),
            "memory_info": generator.get_memory_usage()
        }
        
    except Exception as e:
        logger.error(f"Manual initialization error: {e}")
        raise HTTPException(status_code=500, detail=f"Initialization failed: {str(e)}")

# Legacy endpoint for backward compatibility
@router.post("/generate_legacy")
def generate_legacy(req: LegacyGenerateRequest):
    """Legacy generate endpoint for backward compatibility"""
    return {
        "ok": True, 
        "message": "Legacy generation placeholder - use /generate instead", 
        "input": req.dict()
    }

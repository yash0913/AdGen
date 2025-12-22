import os
import logging
from typing import List, Dict, Any, Optional
from PIL import Image
import torch
from .utils import get_device_info, create_output_directory, save_image, generate_request_id
from .controlnet import ControlNetProcessor
from .prompt_builder import PromptBuilder

logger = logging.getLogger(__name__)

class SDXLGenerator:
    """Production-ready SDXL inference server with ControlNet support"""
    
    def __init__(self, 
                 base_model_id: str = "stabilityai/stable-diffusion-xl-base-1.0",
                 output_base_path: str = None):
        self.base_model_id = base_model_id
        self.output_base_path = output_base_path or self._get_default_output_path()
        
        # Get device information
        self.device, self.has_cuda = get_device_info()
        self.torch_dtype = torch.float16 if self.has_cuda else torch.float32
        
        # Initialize components
        self.controlnet_processor = ControlNetProcessor(
            device=self.device, 
            torch_dtype=self.torch_dtype
        )
        self.prompt_builder = PromptBuilder()
        
        # State tracking
        self._is_initialized = False
        
        logger.info(f"SDXL Generator initialized (device: {self.device}, dtype: {self.torch_dtype})")
    
    def _get_default_output_path(self) -> str:
        """Get default output path relative to Node.js backend"""
        # Navigate from backend/python to backend/node/outputs
        current_dir = os.path.dirname(os.path.abspath(__file__))  # backend/python/app
        backend_python_dir = os.path.dirname(current_dir)  # backend/python
        backend_dir = os.path.dirname(backend_python_dir)  # backend
        node_outputs = os.path.join(backend_dir, "node", "outputs")
        return node_outputs
    
    def initialize(self) -> bool:
        """
        Initialize the SDXL generator with all components
        
        Returns:
            True if initialization successful, False otherwise
        """
        if self._is_initialized:
            logger.info("Generator already initialized")
            return True
        
        try:
            logger.info("Initializing SDXL Generator...")
            
            # Ensure output directory exists
            os.makedirs(self.output_base_path, exist_ok=True)
            logger.info(f"Output directory: {self.output_base_path}")
            
            # Load ControlNet
            if not self.controlnet_processor.load_controlnet():
                logger.error("Failed to load ControlNet")
                return False
            
            # Create pipeline
            pipeline = self.controlnet_processor.create_pipeline(self.base_model_id)
            if not pipeline:
                logger.error("Failed to create pipeline")
                return False
            
            self._is_initialized = True
            logger.info("SDXL Generator initialization completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Generator initialization failed: {e}")
            return False
    
    def generate_ads(self,
                    product_image: Image.Image,
                    trend_profile: Dict[str, Any],
                    brand_name: str = "",
                    headline: str = "",
                    num_images: int = 4,
                    num_inference_steps: int = 30,
                    guidance_scale: float = 7.5,
                    controlnet_conditioning_scale: float = 1.0,
                    base_seed: Optional[int] = None) -> Dict[str, Any]:
        """
        Generate multiple ad creatives based on trend profile and product image
        
        Args:
            product_image: Product image for ControlNet conditioning
            trend_profile: TrendProfile data from MongoDB
            brand_name: Brand name to include in prompts
            headline: Headline to incorporate
            num_images: Number of images to generate (3-5)
            num_inference_steps: Number of denoising steps
            guidance_scale: Guidance scale for classifier-free guidance
            controlnet_conditioning_scale: Strength of ControlNet conditioning
            base_seed: Base seed for reproducible generation
            
        Returns:
            Dictionary with request_id and list of image paths
        """
        if not self._is_initialized:
            raise RuntimeError("Generator not initialized. Call initialize() first.")
        
        # Clamp num_images to 3-5 range as specified
        num_images = max(3, min(5, num_images))
        
        try:
            # Generate unique request ID
            request_id = generate_request_id()
            logger.info(f"Starting ad generation (request: {request_id}, images: {num_images})")
            
            # Create output directory
            output_dir = create_output_directory(self.output_base_path, request_id)
            
            # Prepare control image from product image
            control_image = self.controlnet_processor.prepare_control_image(product_image)
            if not control_image:
                raise ValueError("Failed to prepare control image from product image")
            
            # Build base prompt from trend profile
            base_prompt = self.prompt_builder.build_prompt(
                trend_profile=trend_profile,
                brand_name=brand_name,
                headline=headline
            )
            
            # Get negative prompt
            negative_prompt = self.prompt_builder.get_negative_prompt()
            
            # Generate prompt variations for different styles
            prompt_variations = self.prompt_builder.build_variation_prompts(
                base_prompt, num_images
            )
            
            generated_images = []
            image_paths = []
            
            # Generate each image with variation
            for i in range(num_images):
                try:
                    # Calculate seed for this variation
                    if base_seed is not None:
                        seed = base_seed + i
                    else:
                        seed = None
                    
                    prompt = prompt_variations[i] if i < len(prompt_variations) else base_prompt
                    
                    logger.info(f"Generating image {i+1}/{num_images} (seed: {seed})")
                    
                    # Generate image with ControlNet
                    generated_image = self.controlnet_processor.generate_with_controlnet(
                        prompt=prompt,
                        control_image=control_image,
                        negative_prompt=negative_prompt,
                        num_inference_steps=num_inference_steps,
                        guidance_scale=guidance_scale,
                        controlnet_conditioning_scale=controlnet_conditioning_scale,
                        seed=seed,
                        width=1024,
                        height=1024
                    )
                    
                    if generated_image:
                        # Save image
                        filename = f"ad_{i+1}.png"
                        relative_path = save_image(generated_image, output_dir, filename)
                        
                        generated_images.append(generated_image)
                        image_paths.append(relative_path)
                        
                        logger.info(f"Generated and saved: {relative_path}")
                    else:
                        logger.warning(f"Failed to generate image {i+1}")
                
                except Exception as e:
                    logger.error(f"Error generating image {i+1}: {e}")
                    continue
            
            if not image_paths:
                raise RuntimeError("No images were generated successfully")
            
            result = {
                "requestId": request_id,
                "images": image_paths,
                "numGenerated": len(image_paths),
                "prompt": base_prompt[:200] + "..." if len(base_prompt) > 200 else base_prompt
            }
            
            logger.info(f"Ad generation completed: {len(image_paths)}/{num_images} images")
            return result
            
        except Exception as e:
            logger.error(f"Ad generation failed: {e}")
            raise
    
    def is_ready(self) -> bool:
        """Check if generator is ready for inference"""
        return (self._is_initialized and 
                self.controlnet_processor.is_loaded() and
                self.controlnet_processor.pipeline is not None)
    
    def get_memory_usage(self) -> Dict[str, Any]:
        """Get current GPU memory usage information"""
        info = {
            "device": self.device,
            "has_cuda": self.has_cuda,
            "initialized": self._is_initialized
        }
        
        if self.has_cuda:
            try:
                info.update({
                    "gpu_memory_allocated": torch.cuda.memory_allocated() / 1024**3,  # GB
                    "gpu_memory_reserved": torch.cuda.memory_reserved() / 1024**3,    # GB
                    "gpu_memory_total": torch.cuda.get_device_properties(0).total_memory / 1024**3  # GB
                })
            except Exception as e:
                logger.warning(f"Could not get GPU memory info: {e}")
        
        return info
    
    def cleanup(self):
        """Clean up resources and free GPU memory"""
        logger.info("Cleaning up SDXL Generator...")
        
        try:
            # Cleanup ControlNet
            self.controlnet_processor.cleanup()
            
            # Clear CUDA cache if available
            if self.has_cuda:
                torch.cuda.empty_cache()
            
            self._is_initialized = False
            logger.info("SDXL Generator cleanup completed")
            
        except Exception as e:
            logger.error(f"Error during generator cleanup: {e}")
    
    def __del__(self):
        """Destructor to ensure cleanup"""
        if hasattr(self, '_is_initialized') and self._is_initialized:
            self.cleanup()
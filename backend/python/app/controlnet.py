from PIL import Image
from typing import Optional, Tuple
import logging
import torch
from diffusers import ControlNetModel, StableDiffusionXLControlNetPipeline
from .utils import apply_canny_edge_detection, preprocess_product_image

logger = logging.getLogger(__name__)

class ControlNetProcessor:
    """Handle ControlNet conditioning for product image guidance"""
    
    def __init__(self, device: str = "cuda", torch_dtype: torch.dtype = torch.float16):
        self.device = device
        self.torch_dtype = torch_dtype
        self.controlnet = None
        self.pipeline = None
        self._is_loaded = False
    
    def load_controlnet(self) -> bool:
        """
        Load ControlNet model for canny edge conditioning
        
        Returns:
            True if loaded successfully, False otherwise
        """
        try:
            logger.info("Loading ControlNet model...")
            
            # Load ControlNet model (Canny edge detection)
            self.controlnet = ControlNetModel.from_pretrained(
                "diffusers/controlnet-canny-sdxl-1.0",
                torch_dtype=self.torch_dtype,
                use_safetensors=True
            )
            
            if self.device == "cuda":
                self.controlnet = self.controlnet.to(self.device)
                # Enable memory efficient attention
                if hasattr(self.controlnet, 'enable_xformers_memory_efficient_attention'):
                    try:
                        self.controlnet.enable_xformers_memory_efficient_attention()
                    except Exception as e:
                        logger.warning(f"Could not enable xformers: {e}")
                
                # Enable attention slicing for memory efficiency
                if hasattr(self.controlnet, 'enable_attention_slicing'):
                    self.controlnet.enable_attention_slicing()
            
            logger.info(f"ControlNet loaded successfully on {self.device}")
            self._is_loaded = True
            return True
            
        except Exception as e:
            logger.error(f"Failed to load ControlNet: {e}")
            self._is_loaded = False
            return False
    
    def create_pipeline(self, base_model_id: str = "stabilityai/stable-diffusion-xl-base-1.0") -> Optional[StableDiffusionXLControlNetPipeline]:
        """
        Create SDXL ControlNet pipeline
        
        Args:
            base_model_id: Base SDXL model identifier
            
        Returns:
            Pipeline if created successfully, None otherwise
        """
        if not self._is_loaded:
            logger.error("ControlNet not loaded. Call load_controlnet() first.")
            return None
        
        try:
            logger.info("Creating SDXL ControlNet pipeline...")
            
            self.pipeline = StableDiffusionXLControlNetPipeline.from_pretrained(
                base_model_id,
                controlnet=self.controlnet,
                torch_dtype=self.torch_dtype,
                use_safetensors=True,
                variant="fp16" if self.torch_dtype == torch.float16 else None
            )
            
            if self.device == "cuda":
                self.pipeline = self.pipeline.to(self.device)
                
                # Enable memory efficient attention
                if hasattr(self.pipeline, 'enable_xformers_memory_efficient_attention'):
                    try:
                        self.pipeline.enable_xformers_memory_efficient_attention()
                    except Exception as e:
                        logger.warning(f"Could not enable xformers: {e}")
                
                # Enable attention slicing for memory efficiency
                self.pipeline.enable_attention_slicing()
                
                # Enable CPU offload if memory is limited
                # self.pipeline.enable_model_cpu_offload()
            
            logger.info("SDXL ControlNet pipeline created successfully")
            return self.pipeline
            
        except Exception as e:
            logger.error(f"Failed to create ControlNet pipeline: {e}")
            return None
    
    def prepare_control_image(self, product_image: Image.Image, target_size: Tuple[int, int] = (1024, 1024)) -> Optional[Image.Image]:
        """
        Prepare product image for ControlNet conditioning
        
        Args:
            product_image: Input product image
            target_size: Target image dimensions
            
        Returns:
            Processed control image or None if failed
        """
        try:
            # Preprocess the product image (resize, center, etc.)
            processed_image = preprocess_product_image(product_image, target_size)
            
            # Apply Canny edge detection
            control_image = apply_canny_edge_detection(processed_image)
            
            logger.info(f"Control image prepared: {control_image.size}")
            return control_image
            
        except Exception as e:
            logger.error(f"Failed to prepare control image: {e}")
            return None
    
    def generate_with_controlnet(
        self, 
        prompt: str,
        control_image: Image.Image,
        negative_prompt: str = "",
        num_inference_steps: int = 30,
        guidance_scale: float = 7.5,
        controlnet_conditioning_scale: float = 1.0,
        seed: Optional[int] = None,
        width: int = 1024,
        height: int = 1024
    ) -> Optional[Image.Image]:
        """
        Generate image using ControlNet conditioning
        
        Args:
            prompt: Text prompt for generation
            control_image: Preprocessed control image (canny edges)
            negative_prompt: Negative prompt to avoid unwanted elements
            num_inference_steps: Number of denoising steps
            guidance_scale: Guidance scale for classifier-free guidance
            controlnet_conditioning_scale: Strength of ControlNet conditioning
            seed: Random seed for reproducibility
            width: Output image width
            height: Output image height
            
        Returns:
            Generated image or None if failed
        """
        if not self.pipeline:
            logger.error("Pipeline not created. Call create_pipeline() first.")
            return None
        
        try:
            # Set seed if provided
            if seed is not None:
                generator = torch.Generator(device=self.device).manual_seed(seed)
            else:
                generator = None
            
            logger.info(f"Generating image with ControlNet (steps: {num_inference_steps}, guidance: {guidance_scale})")
            
            # Generate image
            result = self.pipeline(
                prompt=prompt,
                negative_prompt=negative_prompt,
                image=control_image,
                num_inference_steps=num_inference_steps,
                guidance_scale=guidance_scale,
                controlnet_conditioning_scale=controlnet_conditioning_scale,
                generator=generator,
                width=width,
                height=height,
                return_dict=True
            )
            
            generated_image = result.images[0]
            logger.info("Image generated successfully with ControlNet")
            return generated_image
            
        except Exception as e:
            logger.error(f"ControlNet generation failed: {e}")
            return None
    
    def is_loaded(self) -> bool:
        """Check if ControlNet is loaded and ready"""
        return self._is_loaded and self.controlnet is not None
    
    def cleanup(self):
        """Clean up GPU memory"""
        try:
            if self.pipeline:
                del self.pipeline
                self.pipeline = None
            
            if self.controlnet:
                del self.controlnet
                self.controlnet = None
            
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            
            logger.info("ControlNet cleanup completed")
            
        except Exception as e:
            logger.error(f"Error during ControlNet cleanup: {e}")
import os
import io
import uuid
import cv2
import numpy as np
from PIL import Image
from typing import Tuple, Optional
import logging

logger = logging.getLogger(__name__)

def create_output_directory(base_path: str, request_id: str) -> str:
    """Create output directory for generated images"""
    output_dir = os.path.join(base_path, request_id)
    os.makedirs(output_dir, exist_ok=True)
    return output_dir

def save_image(image: Image.Image, output_dir: str, filename: str) -> str:
    """Save PIL Image to output directory and return relative path"""
    full_path = os.path.join(output_dir, filename)
    image.save(full_path, "PNG", optimize=True)
    # Return path relative to backend/node/outputs/
    return f"/outputs/{os.path.basename(output_dir)}/{filename}"

def preprocess_product_image(image: Image.Image, target_size: Tuple[int, int] = (1024, 1024)) -> Image.Image:
    """Preprocess product image for ControlNet conditioning"""
    # Convert to RGB if necessary
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    # Resize while maintaining aspect ratio
    image.thumbnail(target_size, Image.Resampling.LANCZOS)
    
    # Create new image with target size and paste centered
    new_image = Image.new('RGB', target_size, (255, 255, 255))
    paste_x = (target_size[0] - image.width) // 2
    paste_y = (target_size[1] - image.height) // 2
    new_image.paste(image, (paste_x, paste_y))
    
    return new_image

def apply_canny_edge_detection(image: Image.Image, low_threshold: int = 100, high_threshold: int = 200) -> Image.Image:
    """Apply Canny edge detection for ControlNet conditioning"""
    # Convert PIL to OpenCV format
    cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    
    # Convert to grayscale
    gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
    
    # Apply Canny edge detection
    edges = cv2.Canny(gray, low_threshold, high_threshold)
    
    # Convert back to PIL
    edges_rgb = cv2.cvtColor(edges, cv2.COLOR_GRAY2RGB)
    return Image.fromarray(edges_rgb)

def generate_request_id() -> str:
    """Generate unique request ID"""
    return str(uuid.uuid4())

def get_device_info() -> Tuple[str, bool]:
    """Get device information for model loading"""
    try:
        import torch
        if torch.cuda.is_available():
            device = "cuda"
            has_cuda = True
            logger.info(f"CUDA available: {torch.cuda.get_device_name(0)}")
        else:
            device = "cpu"
            has_cuda = False
            logger.info("CUDA not available, using CPU")
        return device, has_cuda
    except ImportError:
        logger.warning("PyTorch not available")
        return "cpu", False

def validate_image_format(image_data: bytes) -> bool:
    """Validate that image data is a supported format"""
    try:
        image = Image.open(io.BytesIO(image_data))
        # Check if it's a valid image format
        return image.format in ['JPEG', 'PNG', 'WEBP', 'BMP']
    except Exception:
        return False

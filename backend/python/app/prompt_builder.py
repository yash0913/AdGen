from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)

class PromptBuilder:
    """Build dynamic prompts from TrendProfile data"""
    
    # Base template structure
    BASE_TEMPLATE = "High-converting {platform} advertisement for the {industry} industry"
    
    # Layout descriptors
    LAYOUT_DESCRIPTORS = {
        "image-centric": "product-focused composition with clean background",
        "text-heavy": "bold typography with prominent text overlay",
        "split-layout": "balanced layout with text and image sections",
        "overlay-text": "text overlaid on product imagery"
    }
    
    # Creative type descriptors
    CREATIVE_DESCRIPTORS = {
        "product-only": "minimal product showcase, clean aesthetic",
        "ugc": "authentic user-generated content style, casual photography",
        "offer-based": "promotional design with clear value proposition",
        "testimonial": "social proof focused, customer-centric design",
        "brand-story": "narrative-driven, brand heritage focused"
    }
    
    # Color palette descriptors
    COLOR_DESCRIPTORS = {
        "blue": "professional blue tones",
        "black": "sleek black accents",
        "white": "clean white backgrounds",
        "red": "bold red highlights",
        "green": "fresh green elements",
        "yellow": "vibrant yellow accents",
        "orange": "energetic orange tones",
        "purple": "sophisticated purple shades",
        "pink": "modern pink highlights",
        "gray": "neutral gray tones"
    }
    
    # Platform-specific modifiers
    PLATFORM_MODIFIERS = {
        "instagram": "square format, mobile-optimized",
        "facebook": "social media optimized, engaging",
        "tiktok": "dynamic, youth-oriented, trendy",
        "pinterest": "vertical format, aspirational"
    }
    
    # Industry-specific contexts
    INDUSTRY_CONTEXTS = {
        "fitness": "health and wellness focused",
        "fashion": "style and trend conscious",
        "food": "appetizing and fresh presentation",
        "beauty": "elegant and luxurious aesthetic",
        "electronics": "modern and tech-savvy design",
        "saas": "professional and solution-oriented"
    }
    
    def __init__(self):
        self.negative_prompt = "blurry, low quality, distorted, watermark, text overlay, poor lighting, amateur photography, cluttered composition"
    
    def build_prompt(self, trend_profile: Dict[str, Any], brand_name: str = "", headline: str = "") -> str:
        """
        Build a comprehensive prompt from TrendProfile data
        
        Args:
            trend_profile: Dictionary containing TrendProfile fields
            brand_name: Optional brand name to include
            headline: Optional headline to incorporate
            
        Returns:
            Complete prompt string for SDXL generation
        """
        try:
            industry = trend_profile.get("industry", "").lower()
            platform = trend_profile.get("platform", "instagram").lower()
            top_colors = trend_profile.get("topColors", [])
            dominant_layouts = trend_profile.get("dominantLayouts", [])
            creative_types = trend_profile.get("creativeTypes", [])
            top_keywords = trend_profile.get("topKeywords", [])
            
            # Start with base template
            prompt_parts = [self.BASE_TEMPLATE.format(
                platform=platform.capitalize(),
                industry=industry.capitalize()
            )]
            
            # Add industry context
            if industry in self.INDUSTRY_CONTEXTS:
                prompt_parts.append(self.INDUSTRY_CONTEXTS[industry])
            
            # Add layout description
            if dominant_layouts:
                layout = dominant_layouts[0].lower()
                if layout in self.LAYOUT_DESCRIPTORS:
                    prompt_parts.append(self.LAYOUT_DESCRIPTORS[layout])
            
            # Add creative type description
            if creative_types:
                creative_type = creative_types[0].lower().replace("-", "_")
                if creative_type in self.CREATIVE_DESCRIPTORS:
                    prompt_parts.append(self.CREATIVE_DESCRIPTORS[creative_type])
            
            # Add color palette
            if top_colors:
                color_descriptions = []
                for color in top_colors[:3]:  # Use top 3 colors
                    color_lower = color.lower().replace("#", "").replace(" ", "")
                    # Try to match common color names
                    for color_name, description in self.COLOR_DESCRIPTORS.items():
                        if color_name in color_lower or color_lower in color_name:
                            color_descriptions.append(description)
                            break
                
                if color_descriptions:
                    prompt_parts.append("color palette: " + ", ".join(color_descriptions[:2]))
            
            # Add platform-specific modifiers
            if platform in self.PLATFORM_MODIFIERS:
                prompt_parts.append(self.PLATFORM_MODIFIERS[platform])
            
            # Add trending keywords (filtered and limited)
            if top_keywords:
                # Filter out generic keywords and limit to most relevant
                filtered_keywords = [kw for kw in top_keywords[:5] 
                                   if len(kw) > 2 and kw.lower() not in ['the', 'and', 'for', 'you', 'your']]
                if filtered_keywords:
                    prompt_parts.append(f"keywords: {', '.join(filtered_keywords[:3])}")
            
            # Add brand context if provided
            if brand_name:
                prompt_parts.append(f"for {brand_name} brand")
            
            # Add quality modifiers
            quality_modifiers = [
                "professional advertisement photography",
                "studio lighting",
                "high resolution",
                "commercial grade",
                "marketing materials"
            ]
            prompt_parts.extend(quality_modifiers)
            
            # Join all parts
            final_prompt = ", ".join(prompt_parts)
            
            logger.info(f"Generated prompt: {final_prompt[:100]}...")
            return final_prompt
            
        except Exception as e:
            logger.error(f"Error building prompt: {e}")
            # Fallback to basic prompt
            return f"Professional advertisement for {trend_profile.get('industry', 'product')} industry, high quality, commercial photography"
    
    def get_negative_prompt(self) -> str:
        """Get negative prompt to avoid unwanted elements"""
        return self.negative_prompt
    
    def build_variation_prompts(self, base_prompt: str, num_variations: int = 3) -> List[str]:
        """
        Create prompt variations for different creative approaches
        
        Args:
            base_prompt: Base prompt to vary
            num_variations: Number of variations to create
            
        Returns:
            List of prompt variations
        """
        variations = [base_prompt]  # Include original
        
        style_modifiers = [
            "minimalist style",
            "bold and dynamic",
            "elegant and sophisticated",
            "modern and trendy",
            "luxury aesthetic"
        ]
        
        for i in range(min(num_variations - 1, len(style_modifiers))):
            varied_prompt = f"{base_prompt}, {style_modifiers[i]}"
            variations.append(varied_prompt)
        
        return variations[:num_variations]
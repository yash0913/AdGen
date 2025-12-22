from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union

class TrendProfileData(BaseModel):
    """TrendProfile data structure from MongoDB"""
    industry: str = Field(..., description="Industry category (e.g., 'fitness', 'fashion')")
    platform: str = Field(default="instagram", description="Platform (e.g., 'instagram', 'facebook')")
    topColors: List[str] = Field(default_factory=list, description="Top trending colors")
    dominantLayouts: List[str] = Field(default_factory=list, description="Dominant layout types")
    creativeTypes: List[str] = Field(default_factory=list, description="Creative types")
    topKeywords: List[str] = Field(default_factory=list, description="Trending keywords")
    avgEngagementScore: Optional[float] = Field(default=None, description="Average engagement score")

class GenerateRequest(BaseModel):
    """Request schema for ad generation endpoint"""
    # Required fields
    industry: str = Field(..., description="Industry category")
    platform: str = Field(..., description="Target platform")
    
    # TrendProfile data
    trendProfile: TrendProfileData = Field(..., description="Trend profile data from MongoDB")
    
    # Optional generation parameters
    brandName: Optional[str] = Field(default="", description="Brand name to include in prompts")
    headline: Optional[str] = Field(default="", description="Headline to incorporate")
    numImages: Optional[int] = Field(default=4, ge=3, le=5, description="Number of images to generate (3-5)")
    
    # Advanced parameters
    numInferenceSteps: Optional[int] = Field(default=30, ge=10, le=50, description="Number of inference steps")
    guidanceScale: Optional[float] = Field(default=7.5, ge=1.0, le=20.0, description="Guidance scale")
    controlnetConditioningScale: Optional[float] = Field(default=1.0, ge=0.1, le=2.0, description="ControlNet conditioning scale")
    baseSeed: Optional[int] = Field(default=None, description="Base seed for reproducible generation")

class GenerateResponse(BaseModel):
    """Response schema for successful generation"""
    requestId: str = Field(..., description="Unique request identifier")
    images: List[str] = Field(..., description="List of relative image paths")
    numGenerated: int = Field(..., description="Number of successfully generated images")
    prompt: Optional[str] = Field(default=None, description="Base prompt used for generation")

class ErrorResponse(BaseModel):
    """Error response schema"""
    error: str = Field(..., description="Error message")
    details: Optional[str] = Field(default=None, description="Additional error details")
    requestId: Optional[str] = Field(default=None, description="Request ID if available")

class HealthResponse(BaseModel):
    """Health check response"""
    status: str = Field(..., description="Service status")
    generator_ready: Optional[bool] = Field(default=None, description="Whether generator is ready")
    memory_info: Optional[Dict[str, Any]] = Field(default=None, description="Memory usage information")

# Legacy schema for backward compatibility
class LegacyGenerateRequest(BaseModel):
    prompt: Optional[str] = None
    seed: Optional[int] = None

from pydantic import BaseModel
from typing import Optional

class GenerateRequest(BaseModel):
    prompt: Optional[str] = None
    seed: Optional[int] = None

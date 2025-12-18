from fastapi import APIRouter
from .schemas import GenerateRequest

router = APIRouter()

@router.get("/health")
def health():
    return {"status": "ok"}

@router.post("/generate")
def generate(req: GenerateRequest):
    return {"ok": True, "message": "Generation placeholder", "input": req.dict()}

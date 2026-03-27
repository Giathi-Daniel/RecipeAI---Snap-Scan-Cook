from fastapi import APIRouter

from services.gemini_service import parser_status

router = APIRouter()


@router.get("/status")
def get_ai_status():
    return parser_status()

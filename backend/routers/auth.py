from fastapi import APIRouter

router = APIRouter()


@router.get("/session")
def get_session_status():
    return {
        "message": "Supabase JWT verification will be implemented on Day 2.",
        "authenticated": False,
    }

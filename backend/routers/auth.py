from typing import Any

from fastapi import APIRouter, Depends, Request

from services.auth_service import get_current_user

router = APIRouter()


@router.get("/session")
def get_session_status(request: Request):
    user = getattr(request.state, "user", None)

    return {
        "authenticated": bool(user),
        "user": user,
    }


@router.get("/me")
def get_authenticated_user(user: dict[str, Any] = Depends(get_current_user)):
    return {"user": user}

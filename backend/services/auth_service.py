import os
from typing import Any

import jwt
from fastapi import HTTPException, Request, status

def decode_supabase_jwt(token: str) -> dict[str, Any]:
    jwt_secret = os.getenv("SUPABASE_JWT_SECRET")
    supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")

    issuer = f"{supabase_url.rstrip('/')}/auth/v1" if supabase_url else None

    if not jwt_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SUPABASE_JWT_SECRET is not configured on the backend.",
        )

    options = {"verify_aud": False, "verify_iss": bool(issuer)}
    decode_kwargs: dict[str, Any] = {
        "jwt": token,
        "key": jwt_secret,
        "algorithms": ["HS256"],
        "options": options,
    }

    if issuer:
        decode_kwargs["issuer"] = issuer

    try:
        payload = jwt.decode(**decode_kwargs)
    except jwt.InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Supabase access token.",
        ) from exc

    return payload


def get_current_user(request: Request) -> dict[str, Any]:
    user = getattr(request.state, "user", None)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )

    return user

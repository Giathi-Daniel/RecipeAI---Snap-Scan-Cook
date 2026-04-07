import json
import logging
import os
import time
from collections import defaultdict, deque
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from routers import ai, auth, recipes, vision
from services.auth_service import decode_supabase_jwt

BASE_DIR = Path(__file__).resolve().parent
logger = logging.getLogger("recipeai.api")

RATE_LIMIT_RULES = {
    "/api/vision/identify": {"limit": 10, "scope": "ip"},
    "/api/recipes/parse": {"limit": 20, "scope": "actor"},
    "/api/recipes/save": {"limit": 20, "scope": "user"},
    "/api/recipes/scale": {"limit": 60, "scope": "actor"},
    "/api/recipes/substitute": {"limit": 30, "scope": "actor"},
    "/api/recipes/localize": {"limit": 20, "scope": "actor"},
    "/api/recipes/": {"limit": 120, "scope": "actor"},
    "/api/auth/": {"limit": 30, "scope": "ip"},
}
request_buckets: dict[str, deque[float]] = defaultdict(deque)

load_dotenv(BASE_DIR / ".env", override=False)
load_dotenv(BASE_DIR / ".env.local", override=True)
RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
DEFAULT_RATE_LIMIT = int(os.getenv("DEFAULT_RATE_LIMIT", "120"))
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]


class JsonLogFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        extra_fields = getattr(record, "extra_fields", None)
        if isinstance(extra_fields, dict):
            payload.update(extra_fields)

        return json.dumps(payload, default=str)


logging.basicConfig(
    level=logging.INFO,
)
for handler in logging.getLogger().handlers:
    handler.setFormatter(JsonLogFormatter())

app = FastAPI(
    title="RecipeAI API",
    description="FastAPI backend for parsing, saving, and enriching recipes with AI.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def supabase_auth_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid4())
    request.state.request_id = request_id
    request.state.user = None
    request.state.access_token = None
    started_at = time.perf_counter()

    client_ip = request.client.host if request.client else "unknown"

    authorization = request.headers.get("Authorization")

    if authorization:
        scheme, _, token = authorization.partition(" ")

        if scheme.lower() != "bearer" or not token:
            response = JSONResponse(
                status_code=401,
                content={"detail": "Authorization header must use Bearer <token>."},
                headers={"X-Request-ID": request_id},
            )
            _log_security_event(
                "auth_header_rejected",
                request=request,
                client_ip=client_ip,
                request_id=request_id,
            )
            _log_request(request, response.status_code, started_at, client_ip, request_id)
            return response

        try:
            request.state.user = decode_supabase_jwt(token)
            request.state.access_token = token
        except Exception as exc:
            if hasattr(exc, "status_code") and hasattr(exc, "detail"):
                response = JSONResponse(
                    status_code=exc.status_code,
                    content={"detail": exc.detail},
                    headers={"X-Request-ID": request_id},
                )
                _log_security_event(
                    "auth_token_rejected",
                    request=request,
                    client_ip=client_ip,
                    request_id=request_id,
                )
                _log_request(request, response.status_code, started_at, client_ip, request_id)
                return response
            raise

    limit, scope = _resolve_rate_limit_rule(request.url.path)
    actor_key = _resolve_actor_key(request, client_ip, scope)
    bucket_key = f"{actor_key}:{request.url.path}"
    bucket = request_buckets[bucket_key]
    now = time.time()

    while bucket and now - bucket[0] > RATE_LIMIT_WINDOW_SECONDS:
        bucket.popleft()

    if len(bucket) >= limit:
        _log_security_event(
            "rate_limit_exceeded",
            request=request,
            client_ip=client_ip,
            request_id=request_id,
            limit=limit,
            scope=scope,
            actor_key=actor_key,
        )
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests. Please slow down and try again."},
            headers={"X-Request-ID": request_id},
        )

    bucket.append(now)

    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    _log_request(request, response.status_code, started_at, client_ip, request_id)
    return response


def _resolve_rate_limit_rule(path: str) -> tuple[int, str]:
    for prefix, rule in RATE_LIMIT_RULES.items():
        if path.startswith(prefix):
            return int(rule["limit"]), str(rule["scope"])
    return DEFAULT_RATE_LIMIT, "actor"


def _resolve_actor_key(request: Request, client_ip: str, scope: str) -> str:
    user = getattr(request.state, "user", None) or {}
    user_id = user.get("sub") if isinstance(user, dict) else None

    if scope == "user" and user_id:
        return f"user:{user_id}"
    if scope == "ip":
        return f"ip:{client_ip}"
    if user_id:
        return f"user:{user_id}"
    return f"ip:{client_ip}"


def _log_request(
    request: Request,
    status_code: int,
    started_at: float,
    client_ip: str,
    request_id: str,
) -> None:
    duration_ms = round((time.perf_counter() - started_at) * 1000, 2)
    logger.info(
        "request_completed",
        extra={
            "extra_fields": {
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status": status_code,
                "duration_ms": duration_ms,
                "ip": client_ip,
                "user_id": (getattr(request.state, "user", None) or {}).get("sub"),
            }
        },
    )


def _log_security_event(
    event: str,
    request: Request,
    client_ip: str,
    request_id: str,
    **fields,
) -> None:
    logger.warning(
        event,
        extra={
            "extra_fields": {
                "event": event,
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "ip": client_ip,
                **fields,
            }
        },
    )

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(recipes.router, prefix="/api/recipes", tags=["recipes"])
app.include_router(vision.router, prefix="/api/vision", tags=["vision"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])


@app.get("/health")
def healthcheck():
    return {"status": "ok", "service": "recipeai-backend"}

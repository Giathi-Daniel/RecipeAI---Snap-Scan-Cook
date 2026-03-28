from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routers import ai, auth, recipes, vision
from services.auth_service import decode_supabase_jwt

app = FastAPI(
    title="RecipeAI API",
    description="FastAPI backend for parsing, saving, and enriching recipes with AI.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def supabase_auth_middleware(request: Request, call_next):
    request.state.user = None

    authorization = request.headers.get("Authorization")

    if authorization:
        scheme, _, token = authorization.partition(" ")

        if scheme.lower() != "bearer" or not token:
            return JSONResponse(
                status_code=401,
                content={"detail": "Authorization header must use Bearer <token>."},
            )

        try:
            request.state.user = decode_supabase_jwt(token)
        except Exception as exc:
            if hasattr(exc, "status_code") and hasattr(exc, "detail"):
                return JSONResponse(
                    status_code=exc.status_code,
                    content={"detail": exc.detail},
                )
            raise

    return await call_next(request)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(recipes.router, prefix="/api/recipes", tags=["recipes"])
app.include_router(vision.router, prefix="/api/vision", tags=["vision"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])


@app.get("/health")
def healthcheck():
    return {"status": "ok", "service": "recipeai-backend"}

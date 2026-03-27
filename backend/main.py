from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import ai, auth, recipes, vision

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

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(recipes.router, prefix="/api/recipes", tags=["recipes"])
app.include_router(vision.router, prefix="/api/vision", tags=["vision"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])


@app.get("/health")
def healthcheck():
    return {"status": "ok", "service": "recipeai-backend"}

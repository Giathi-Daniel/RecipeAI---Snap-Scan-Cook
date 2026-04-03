from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status

from models.recipe import (
    Ingredient,
    Nutrition,
    ParseRecipeRequest,
    ParseRecipeResponse,
    Recipe,
    SaveRecipeRequest,
    SaveRecipeResponse,
    Step,
    StructuredRecipeData,
)
from services.auth_service import get_current_user
from services.gemini_service import parse_recipe
from services.supabase_service import insert_recipe, insert_saved_recipe

router = APIRouter()

demo_recipe = Recipe(
    title="Braised Coconut Chicken",
    description="A warm, weeknight-friendly recipe used to prove the API scaffold is healthy.",
    image_url=None,
    source_text="Demo source text",
    structured_data=StructuredRecipeData(
        ingredients=[
            Ingredient(quantity="1", unit="whole", item="chicken"),
            Ingredient(quantity="1", unit="cup", item="coconut milk"),
        ],
        steps=[
            Step(order=1, instruction="Brown the chicken."),
            Step(order=2, instruction="Simmer with aromatics and coconut milk."),
        ],
        tags=["demo", "protein-rich"],
    ),
    nutrition=Nutrition(calories=420, protein_g=34, carbs_g=12, fat_g=26),
    servings=4,
)


@router.get("/demo", response_model=Recipe)
def get_demo_recipe():
    return demo_recipe


@router.post("/parse", response_model=ParseRecipeResponse)
def parse_recipe_text(payload: ParseRecipeRequest):
    return parse_recipe(payload.text)


@router.post("/save", response_model=SaveRecipeResponse)
async def save_recipe(
    request: Request,
    payload: SaveRecipeRequest,
    current_user: dict = Depends(get_current_user),
):
    access_token = getattr(request.state, "access_token", None)

    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="A valid Supabase access token is required to save recipes.",
        )

    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated Supabase token is missing the user id.",
        )

    recipe = await insert_recipe(
        {
            "user_id": user_id,
            "title": payload.title,
            "description": payload.description,
            "image_url": None,
            "source_text": payload.source_text,
            "structured_data": {
                "ingredients": [ingredient.model_dump() for ingredient in payload.ingredients],
                "steps": [step.model_dump() for step in payload.steps],
                "tags": payload.tags,
            },
            "nutrition": None,
            "servings": payload.servings,
        },
        access_token=access_token,
    )

    saved_recipe = await insert_saved_recipe(
        {
            "user_id": user_id,
            "recipe_id": str(recipe.id) if isinstance(recipe.id, UUID) else recipe.id,
        },
        access_token=access_token,
    )

    return SaveRecipeResponse(recipe=recipe, saved_recipe=saved_recipe)

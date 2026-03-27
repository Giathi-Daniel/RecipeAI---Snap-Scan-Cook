from fastapi import APIRouter

from models.recipe import Ingredient, Nutrition, Recipe, Step

router = APIRouter()

demo_recipe = Recipe(
    id="demo-recipe",
    title="Braised Coconut Chicken",
    description="A warm, weeknight-friendly recipe used to prove the API scaffold is healthy.",
    image_url=None,
    source_text="Demo source text",
    ingredients=[
        Ingredient(quantity="1", unit="whole", item="chicken"),
        Ingredient(quantity="1", unit="cup", item="coconut milk"),
    ],
    steps=[
        Step(order=1, instruction="Brown the chicken."),
        Step(order=2, instruction="Simmer with aromatics and coconut milk."),
    ],
    nutrition=Nutrition(calories=420, protein_g=34, carbs_g=12, fat_g=26),
    servings=4,
    tags=["demo", "protein-rich"],
)


@router.get("/demo", response_model=Recipe)
def get_demo_recipe():
    return demo_recipe

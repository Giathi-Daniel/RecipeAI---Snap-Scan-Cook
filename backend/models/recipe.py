from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class Ingredient(BaseModel):
    quantity: str
    unit: Optional[str] = None
    item: str


class Step(BaseModel):
    order: int
    instruction: str


class Nutrition(BaseModel):
    calories: int
    protein_g: int
    carbs_g: int
    fat_g: int


class StructuredRecipeData(BaseModel):
    ingredients: list[Ingredient]
    steps: list[Step]
    tags: list[str] = Field(default_factory=list)


class Recipe(BaseModel):
    id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    title: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    source_text: Optional[str] = None
    structured_data: StructuredRecipeData
    nutrition: Optional[Nutrition] = None
    servings: int = 4
    created_at: Optional[datetime] = None


class SavedRecipe(BaseModel):
    id: Optional[UUID] = None
    user_id: UUID
    recipe_id: UUID
    created_at: Optional[datetime] = None


class SaveRecipeResponse(BaseModel):
    recipe: Recipe
    saved_recipe: SavedRecipe

from datetime import datetime
from typing import Any, Optional
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
    dietary_flags: list[str] = Field(default_factory=list)


class StructuredRecipeData(BaseModel):
    ingredients: list[Ingredient]
    steps: list[Step]
    tags: list[str] = Field(default_factory=list)


class ParsedRecipe(BaseModel):
    title: str
    description: Optional[str] = None
    ingredients: list[Ingredient]
    steps: list[Step]
    servings: int = 4
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
    is_public: bool = False
    created_at: Optional[datetime] = None


class SavedRecipe(BaseModel):
    id: Optional[UUID] = None
    user_id: UUID
    recipe_id: UUID
    created_at: Optional[datetime] = None


class SaveRecipeResponse(BaseModel):
    recipe: Recipe
    saved_recipe: SavedRecipe


class ParseRecipeRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Raw recipe text to parse.")


class ParseRecipeResponse(BaseModel):
    recipe: ParsedRecipe
    raw_response: dict[str, Any]


class SaveRecipeRequest(BaseModel):
    title: str = Field(..., min_length=1)
    description: Optional[str] = None
    source_text: str = Field(..., min_length=1)
    ingredients: list[Ingredient] = Field(default_factory=list)
    steps: list[Step] = Field(default_factory=list)
    servings: int = Field(default=4, ge=1)
    tags: list[str] = Field(default_factory=list)


class RecipeLookupResponse(BaseModel):
    recipe: Recipe


class ShareRecipeResponse(BaseModel):
    recipe: Recipe
    public_url: str


class VisionIdentifyResponse(BaseModel):
    dish_name: str
    labels: list[str] = Field(default_factory=list)
    recipe: ParsedRecipe
    raw_response: dict[str, Any]


class ScaleRecipeRequest(BaseModel):
    ingredients: list[Ingredient] = Field(default_factory=list)
    original_servings: int = Field(..., ge=1)
    target_servings: int = Field(..., ge=1)


class ScaleRecipeResponse(BaseModel):
    ingredients: list[Ingredient] = Field(default_factory=list)
    original_servings: int
    target_servings: int


class SubstituteIngredientRequest(BaseModel):
    ingredient: Ingredient
    recipe_title: str = Field(..., min_length=1)
    recipe_description: Optional[str] = None
    tags: list[str] = Field(default_factory=list)


class IngredientSubstitutionOption(BaseModel):
    name: str
    reason: str
    notes: Optional[str] = None


class SubstituteIngredientResponse(BaseModel):
    ingredient: Ingredient
    substitutions: list[IngredientSubstitutionOption] = Field(default_factory=list)


class LocalizeRecipeRequest(BaseModel):
    region: str = Field(..., min_length=1)
    recipe: ParsedRecipe


class LocalizedRecipeResponse(BaseModel):
    region: str
    recipe: ParsedRecipe

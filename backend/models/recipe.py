from typing import Optional

from pydantic import BaseModel


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


class Recipe(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    source_text: Optional[str] = None
    ingredients: list[Ingredient]
    steps: list[Step]
    nutrition: Optional[Nutrition] = None
    servings: int = 4
    tags: list[str] = []

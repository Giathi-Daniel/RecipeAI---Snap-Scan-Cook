import asyncio
import unittest
from unittest.mock import patch

from fastapi.exceptions import HTTPException

from models.recipe import (
    Ingredient,
    ParseRecipeRequest,
    ParseRecipeResponse,
    ParsedRecipe,
    ScaleRecipeRequest,
)
from routers.recipes import parse_recipe_text, scale_recipe
from routers.vision import identify_dish_from_image


class FakeUploadFile:
    def __init__(self, content_type: str, payload: bytes, filename: str = "upload.bin"):
        self.content_type = content_type
        self.filename = filename
        self._payload = payload

    async def read(self) -> bytes:
        return self._payload


class ApiRouteTests(unittest.TestCase):
    @patch("routers.recipes.parse_recipe")
    def test_parse_recipe_route_returns_structured_recipe(self, mock_parse_recipe):
        mock_parse_recipe.return_value = ParseRecipeResponse(
            recipe=ParsedRecipe(
                title="Chapati",
                description="Layered flatbread",
                ingredients=[],
                steps=[],
                servings=4,
                tags=["bread"],
            ),
            raw_response={},
        )

        response = parse_recipe_text(ParseRecipeRequest(text="Chapati recipe"))

        self.assertEqual(response.recipe.title, "Chapati")

    def test_scale_recipe_route_returns_scaled_ingredients(self):
        response = scale_recipe(
            ScaleRecipeRequest(
                ingredients=[
                    Ingredient(quantity="2", unit="tbsp", item="olive oil"),
                    Ingredient(quantity="1/2", unit="cup", item="stock"),
                    Ingredient(quantity="a pinch", unit=None, item="salt"),
                ],
                original_servings=4,
                target_servings=8,
            )
        )

        self.assertEqual(
            [ingredient.quantity for ingredient in response.ingredients],
            ["4", "1", "a pinch"],
        )

    @patch("routers.vision.generate_recipe_from_dish_labels")
    @patch("routers.vision.identify_dish")
    def test_vision_route_returns_generated_recipe(
        self,
        mock_identify_dish,
        mock_generate_recipe,
    ):
        mock_identify_dish.return_value = ("Pilau", ["Food", "Pilau", "Rice"])
        mock_generate_recipe.return_value = ParseRecipeResponse(
            recipe=ParsedRecipe(
                title="Pilau",
                description="Spiced rice dish",
                ingredients=[],
                steps=[],
                servings=4,
                tags=["rice"],
            ),
            raw_response={"title": "Pilau"},
        )

        upload = FakeUploadFile(content_type="image/png", payload=b"fake-image", filename="pilau.png")

        response = asyncio.run(identify_dish_from_image(upload))

        self.assertEqual(response.dish_name, "Pilau")
        self.assertEqual(response.recipe.title, "Pilau")

    def test_vision_route_rejects_invalid_file_type(self):
        upload = FakeUploadFile(content_type="text/plain", payload=b"text", filename="notes.txt")

        with self.assertRaises(HTTPException) as context:
            asyncio.run(identify_dish_from_image(upload))

        self.assertEqual(context.exception.status_code, 422)
        self.assertEqual(context.exception.detail, "Upload a valid image file.")

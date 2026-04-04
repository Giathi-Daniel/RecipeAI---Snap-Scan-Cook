import unittest

from models.recipe import Ingredient, ParsedRecipe, Step
from services.gemini_service import _build_nutrition_prompt, _load_recipe_json


class GeminiJsonParsingTests(unittest.TestCase):
    def test_load_recipe_json_handles_markdown_fences(self):
        payload = _load_recipe_json(
            """```json
            {
              "title": "Pilau",
              "description": "Spiced rice",
              "ingredients": [],
              "steps": [],
              "servings": 4,
              "tags": ["rice"]
            }
            ```"""
        )

        self.assertEqual(payload["title"], "Pilau")
        self.assertEqual(payload["servings"], 4)

    def test_load_recipe_json_rejects_missing_object(self):
        with self.assertRaises(ValueError):
            _load_recipe_json("no json here")

    def test_build_nutrition_prompt_includes_servings_and_ingredients(self):
        recipe = ParsedRecipe(
            title="Vegetable Pilau",
            description="Spiced rice with vegetables.",
            ingredients=[
                Ingredient(quantity="2", unit="cups", item="rice"),
                Ingredient(quantity="1", unit="tbsp", item="oil"),
            ],
            steps=[Step(order=1, instruction="Cook until fluffy.")],
            servings=4,
            tags=["vegetarian"],
        )

        prompt = _build_nutrition_prompt(recipe)

        self.assertIn("Servings: 4", prompt)
        self.assertIn("- 2 cups rice", prompt)
        self.assertIn("Estimate calories, protein, carbs, fat, and dietary flags per serving.", prompt)

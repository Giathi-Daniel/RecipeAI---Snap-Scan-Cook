import asyncio
import unittest
from unittest.mock import patch

from fastapi.exceptions import HTTPException

from models.recipe import (
    Ingredient,
    IngredientSubstitutionOption,
    LocalizeRecipeRequest,
    LocalizedRecipeResponse,
    Nutrition,
    ParseRecipeRequest,
    ParseRecipeResponse,
    ParsedRecipe,
    Recipe,
    SavedRecipe,
    SaveRecipeRequest,
    ScaleRecipeRequest,
    StructuredRecipeData,
    SubstituteIngredientRequest,
    SubstituteIngredientResponse,
)
from routers.recipes import (
    get_demo_recipe,
    get_demo_recipe_alias,
    get_public_recipe_by_id,
    get_recipe_by_id,
    localize_recipe_route,
    parse_recipe_text,
    save_recipe,
    scale_recipe,
    share_recipe_by_id,
    substitute_ingredient,
)
from routers.vision import identify_dish_from_image


class FakeUploadFile:
    def __init__(self, content_type: str, payload: bytes, filename: str = "upload.bin"):
        self.content_type = content_type
        self.filename = filename
        self._payload = payload

    async def read(self) -> bytes:
        return self._payload


class ApiRouteTests(unittest.TestCase):
    def test_demo_recipe_alias_matches_primary_demo_recipe(self):
        self.assertEqual(get_demo_recipe_alias().title, get_demo_recipe().title)

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

    @patch("routers.recipes.suggest_substitutions")
    def test_substitute_ingredient_route_returns_options(self, mock_suggest_substitutions):
        ingredient = Ingredient(quantity="1", unit="cup", item="coconut milk")
        mock_suggest_substitutions.return_value = SubstituteIngredientResponse(
            ingredient=ingredient,
            substitutions=[
                IngredientSubstitutionOption(
                    name="Evaporated milk",
                    reason="Keeps the creamy body for stews and braises.",
                    notes="Use the same amount and add a splash of water if needed.",
                )
            ],
        )

        response = substitute_ingredient(
            SubstituteIngredientRequest(
                ingredient=ingredient,
                recipe_title="Braised Coconut Chicken",
                recipe_description="Comforting chicken braise",
                tags=["stew"],
            )
        )

        self.assertEqual(response.substitutions[0].name, "Evaporated milk")

    @patch("routers.recipes.localize_recipe")
    def test_localize_recipe_route_returns_region_adapted_recipe(self, mock_localize_recipe):
        mock_localize_recipe.return_value = LocalizedRecipeResponse(
            region="Kenya",
            recipe=ParsedRecipe(
                title="Kenyan-Style Coconut Beans",
                description="Localized with familiar pantry staples.",
                ingredients=[],
                steps=[],
                servings=4,
                tags=["kenyan-style"],
            ),
        )

        response = localize_recipe_route(
            LocalizeRecipeRequest(
                region="Kenya",
                recipe=ParsedRecipe(
                    title="Coconut Beans",
                    description="Original",
                    ingredients=[],
                    steps=[],
                    servings=4,
                    tags=["beans"],
                ),
            )
        )

        self.assertEqual(response.region, "Kenya")
        self.assertEqual(response.recipe.title, "Kenyan-Style Coconut Beans")

    @patch("routers.recipes.insert_saved_recipe")
    @patch("routers.recipes.insert_recipe")
    @patch("routers.recipes.estimate_nutrition")
    def test_save_recipe_route_persists_estimated_nutrition(
        self,
        mock_estimate_nutrition,
        mock_insert_recipe,
        mock_insert_saved_recipe,
    ):
        mock_estimate_nutrition.return_value = Nutrition(
            calories=420,
            protein_g=32,
            carbs_g=18,
            fat_g=21,
            dietary_flags=["High-Protein", "Gluten-Free"],
        )
        mock_insert_recipe.return_value = Recipe(
            id="00000000-0000-0000-0000-000000000001",
            user_id="00000000-0000-0000-0000-000000000002",
            title="Chicken Stew",
            description="Comforting stew",
            source_text="Chicken stew",
            structured_data=StructuredRecipeData(
                ingredients=[],
                steps=[],
                tags=["stew"],
            ),
            nutrition=mock_estimate_nutrition.return_value,
            servings=4,
        )
        mock_insert_saved_recipe.return_value = SavedRecipe(
            id="00000000-0000-0000-0000-000000000003",
            user_id="00000000-0000-0000-0000-000000000002",
            recipe_id="00000000-0000-0000-0000-000000000001",
        )

        class MockState:
            access_token = "token"

        class MockRequest:
            state = MockState()

        response = asyncio.run(
            save_recipe(
                request=MockRequest(),
                payload=SaveRecipeRequest(
                    title="Chicken Stew",
                    description="Comforting stew",
                    source_text="Chicken stew",
                    ingredients=[],
                    steps=[],
                    servings=4,
                    tags=["stew"],
                ),
                current_user={"sub": "00000000-0000-0000-0000-000000000002"},
            )
        )

        insert_payload = mock_insert_recipe.await_args.args[0]
        self.assertEqual(insert_payload["nutrition"]["calories"], 420)
        self.assertEqual(response.recipe.nutrition.dietary_flags, ["High-Protein", "Gluten-Free"])

    @patch("routers.recipes.get_recipe")
    def test_get_recipe_by_id_returns_recipe_payload(self, mock_get_recipe):
        mock_get_recipe.return_value = Recipe(
            id="00000000-0000-0000-0000-000000000001",
            user_id="00000000-0000-0000-0000-000000000002",
            title="Pilau",
            description="Spiced rice",
            source_text="Pilau",
            structured_data=StructuredRecipeData(
                ingredients=[],
                steps=[],
                tags=["rice"],
            ),
            nutrition=Nutrition(
                calories=390,
                protein_g=11,
                carbs_g=52,
                fat_g=14,
                dietary_flags=["Dairy-Free", "Vegetarian"],
            ),
            servings=4,
        )

        class MockState:
            access_token = "token"

        class MockRequest:
            state = MockState()

        response = asyncio.run(
            get_recipe_by_id(
                recipe_id="00000000-0000-0000-0000-000000000001",
                request=MockRequest(),
                current_user={"sub": "00000000-0000-0000-0000-000000000002"},
            )
        )

        self.assertEqual(response.recipe.title, "Pilau")
        self.assertIn("Vegetarian", response.recipe.nutrition.dietary_flags)

    @patch("routers.recipes.get_public_recipe")
    def test_get_public_recipe_by_id_returns_public_recipe_payload(self, mock_get_public_recipe):
        mock_get_public_recipe.return_value = Recipe(
            id="00000000-0000-0000-0000-000000000001",
            title="Pilau",
            description="Spiced rice",
            structured_data=StructuredRecipeData(
                ingredients=[],
                steps=[],
                tags=["rice"],
            ),
            servings=4,
            is_public=True,
        )

        response = asyncio.run(
            get_public_recipe_by_id("00000000-0000-0000-0000-000000000001")
        )

        self.assertTrue(response.recipe.is_public)
        self.assertEqual(response.recipe.title, "Pilau")

    @patch("routers.recipes.share_recipe")
    def test_share_recipe_route_marks_recipe_public(self, mock_share_recipe):
        mock_share_recipe.return_value = Recipe(
            id="00000000-0000-0000-0000-000000000001",
            user_id="00000000-0000-0000-0000-000000000002",
            title="Pilau",
            description="Spiced rice",
            structured_data=StructuredRecipeData(
                ingredients=[],
                steps=[],
                tags=["rice"],
            ),
            servings=4,
            is_public=True,
        )

        class MockState:
            access_token = "token"

        class MockRequest:
            state = MockState()

        response = asyncio.run(
            share_recipe_by_id(
                recipe_id="00000000-0000-0000-0000-000000000001",
                request=MockRequest(),
                current_user={"sub": "00000000-0000-0000-0000-000000000002"},
            )
        )

        self.assertTrue(response.recipe.is_public)
        self.assertEqual(response.public_url, "/recipe/00000000-0000-0000-0000-000000000001")

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

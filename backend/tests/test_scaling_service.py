import unittest

from models.recipe import Ingredient
from services.scaling_service import scale_ingredients


class ScalingServiceTests(unittest.TestCase):
    def test_scales_numeric_and_fractional_quantities(self):
        response = scale_ingredients(
            ingredients=[
                Ingredient(quantity="2", unit="tbsp", item="olive oil"),
                Ingredient(quantity="1/2", unit="cup", item="coconut milk"),
                Ingredient(quantity="1 1/2", unit="tsp", item="salt"),
            ],
            original_servings=4,
            target_servings=8,
        )

        self.assertEqual(
            [ingredient.quantity for ingredient in response.ingredients],
            ["4", "1", "3"],
        )

    def test_keeps_non_numeric_quantities_unchanged(self):
        response = scale_ingredients(
            ingredients=[
                Ingredient(quantity="a pinch", unit=None, item="salt"),
                Ingredient(quantity="to taste", unit=None, item="black pepper"),
            ],
            original_servings=2,
            target_servings=6,
        )

        self.assertEqual(
            [ingredient.quantity for ingredient in response.ingredients],
            ["a pinch", "to taste"],
        )

    def test_handles_downscaling_to_mixed_fraction(self):
        response = scale_ingredients(
            ingredients=[Ingredient(quantity="3", unit="medium", item="carrots")],
            original_servings=6,
            target_servings=3,
        )

        self.assertEqual(response.ingredients[0].quantity, "1 1/2")

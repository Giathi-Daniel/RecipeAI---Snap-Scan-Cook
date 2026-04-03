from __future__ import annotations

from fractions import Fraction
from typing import Optional

from models.recipe import Ingredient, ScaleRecipeResponse


def scale_ingredients(
    ingredients: list[Ingredient],
    original_servings: int,
    target_servings: int,
) -> ScaleRecipeResponse:
    if original_servings < 1 or target_servings < 1:
        raise ValueError("Servings must be positive integers.")

    multiplier = Fraction(target_servings, original_servings)
    scaled_ingredients = [
        Ingredient(
            quantity=_scale_quantity_text(ingredient.quantity, multiplier),
            unit=ingredient.unit,
            item=ingredient.item,
        )
        for ingredient in ingredients
    ]

    return ScaleRecipeResponse(
        ingredients=scaled_ingredients,
        original_servings=original_servings,
        target_servings=target_servings,
    )


def _scale_quantity_text(quantity: str, multiplier: Fraction) -> str:
    parsed_quantity = _parse_fraction(quantity)

    if parsed_quantity is None:
        return quantity

    scaled_quantity = parsed_quantity * multiplier
    return _format_fraction(scaled_quantity)


def _parse_fraction(raw_quantity: str) -> Optional[Fraction]:
    candidate = raw_quantity.strip()
    if not candidate:
        return None

    normalized = candidate.replace("-", " ")
    try:
        parts = normalized.split()
        if not parts:
            return None

        total = Fraction(0)
        for part in parts:
            total += Fraction(part)
        return total
    except (ValueError, ZeroDivisionError):
        return None


def _format_fraction(value: Fraction) -> str:
    if value.denominator == 1:
        return str(value.numerator)

    whole_number = value.numerator // value.denominator
    remainder = Fraction(value.numerator % value.denominator, value.denominator)

    if whole_number and remainder:
        return f"{whole_number} {remainder.numerator}/{remainder.denominator}"

    if whole_number and not remainder:
        return str(whole_number)

    return f"{remainder.numerator}/{remainder.denominator}"

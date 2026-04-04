import json
import logging
import os
from typing import Any

import google.generativeai as genai
from fastapi import HTTPException, status
from pydantic import ValidationError

from models.recipe import Nutrition, ParseRecipeResponse, ParsedRecipe

logger = logging.getLogger(__name__)

MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")
SYSTEM_PROMPT = """
You are a recipe parsing engine.
Convert raw recipe text into clean JSON only.

Return an object with exactly these keys:
- title: string
- description: string or null
- ingredients: array of objects with keys quantity, unit, item
- steps: array of objects with keys order, instruction
- servings: integer
- tags: array of strings

Rules:
- Infer a concise title if the source text does not provide one.
- Keep descriptions short and factual.
- Preserve ingredient meaning while normalizing formatting.
- quantity must always be a string, even for fractions like "1/2".
- unit must be null when absent.
- item should contain the ingredient name and any clarifying prep note.
- steps must be ordered starting at 1.
- servings must be a positive integer. Default to 4 if unknown.
- tags should be short lowercase labels when obvious, otherwise [].
- Do not include markdown fences, prose, comments, or extra keys.
""".strip()

VISION_RECIPE_SYSTEM_PROMPT = """
You are a recipe generation engine.
Turn dish-identification clues into a realistic recipe as clean JSON only.

Return an object with exactly these keys:
- title: string
- description: string or null
- ingredients: array of objects with keys quantity, unit, item
- steps: array of objects with keys order, instruction
- servings: integer
- tags: array of strings

Rules:
- Base the recipe on the most likely prepared dish suggested by the labels.
- Prefer practical, home-cook-friendly ingredients and steps.
- Keep descriptions short and factual.
- quantity must always be a string, even for fractions like "1/2".
- unit must be null when absent.
- item should contain the ingredient name and any clarifying prep note.
- steps must be ordered starting at 1.
- servings must be a positive integer. Default to 4 if unknown.
- tags should be short lowercase labels when obvious, otherwise [].
- Do not include markdown fences, prose, comments, or extra keys.
""".strip()

NUTRITION_SYSTEM_PROMPT = """
You are a recipe nutrition estimation engine.
Estimate nutrition per serving and dietary flags from the provided recipe.

Return an object with exactly these keys:
- calories: integer
- protein_g: integer
- carbs_g: integer
- fat_g: integer
- dietary_flags: array of strings

Rules:
- Estimate values per serving, not for the full recipe.
- Return whole-number grams for protein, carbs, and fat.
- Use short dietary flags chosen only when they clearly apply.
- Allowed dietary flags: Gluten-Free, Dairy-Free, High-Protein, Vegetarian, Vegan, Nut-Free
- Omit uncertain flags instead of guessing.
- Do not include markdown fences, prose, comments, or extra keys.
""".strip()


def parser_status():
    return {
        "provider": "Gemini",
        "ready": bool(os.getenv("GEMINI_API_KEY")),
        "model": MODEL_NAME,
        "message": "Recipe parsing is available when GEMINI_API_KEY is configured.",
    }


def parse_recipe(text: str) -> ParseRecipeResponse:
    cleaned_text = text.strip()
    if not cleaned_text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Recipe text is required.",
        )

    return _generate_recipe_response(
        prompt=cleaned_text,
        system_prompt=SYSTEM_PROMPT,
        log_context=f"Parsing recipe text with Gemini. chars={len(cleaned_text)}",
        failure_detail=f"Gemini failed to parse the recipe text with model '{MODEL_NAME}'.",
    )


def generate_recipe_from_dish_labels(labels: list[str], dish_name: str) -> ParseRecipeResponse:
    cleaned_labels = [label.strip() for label in labels if label.strip()]
    cleaned_dish = dish_name.strip()

    if not cleaned_labels:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="At least one image label is required to generate a recipe.",
        )

    if not cleaned_dish:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A dish name is required to generate a recipe.",
        )

    prompt = (
        f"Most likely dish: {cleaned_dish}\n"
        f"Vision labels: {', '.join(cleaned_labels)}\n\n"
        f"Generate a realistic recipe for {cleaned_dish} based on these clues."
    )

    return _generate_recipe_response(
        prompt=prompt,
        system_prompt=VISION_RECIPE_SYSTEM_PROMPT,
        log_context=(
            "Generating recipe from image labels with Gemini. "
            f"dish={cleaned_dish} labels={cleaned_labels}"
        ),
        failure_detail=(
            f"Gemini failed to generate a recipe from image labels with model '{MODEL_NAME}'."
        ),
    )


def estimate_nutrition(recipe: ParsedRecipe) -> Nutrition:
    prompt = _build_nutrition_prompt(recipe)

    payload = _generate_json_payload(
        prompt=prompt,
        system_prompt=NUTRITION_SYSTEM_PROMPT,
        log_context=(
            "Estimating recipe nutrition with Gemini. "
            f"title={recipe.title!r} servings={recipe.servings}"
        ),
        failure_detail=(
            f"Gemini failed to estimate recipe nutrition with model '{MODEL_NAME}'."
        ),
        malformed_detail="Gemini returned malformed nutrition JSON.",
    )

    try:
        return Nutrition.model_validate(payload)
    except ValidationError as exc:
        logger.exception("Gemini returned invalid nutrition payload.")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Gemini returned malformed nutrition JSON.",
        ) from exc


def _generate_recipe_response(
    prompt: str,
    system_prompt: str,
    log_context: str,
    failure_detail: str,
) -> ParseRecipeResponse:
    payload = _generate_json_payload(
        prompt=prompt,
        system_prompt=system_prompt,
        log_context=log_context,
        failure_detail=failure_detail,
        malformed_detail="Gemini returned malformed recipe JSON.",
    )

    try:
        recipe = ParsedRecipe.model_validate(payload)
    except ValidationError as exc:
        logger.exception("Gemini returned invalid recipe payload.")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Gemini returned malformed recipe JSON.",
        ) from exc

    normalized_payload = recipe.model_dump()
    return ParseRecipeResponse(recipe=recipe, raw_response=normalized_payload)


def _generate_json_payload(
    prompt: str,
    system_prompt: str,
    log_context: str,
    failure_detail: str,
    malformed_detail: str,
) -> dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GEMINI_API_KEY is not configured on the backend.",
        )

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(
        model_name=MODEL_NAME,
        system_instruction=system_prompt,
    )

    logger.info(log_context)

    try:
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.2,
                "response_mime_type": "application/json",
            },
        )
    except Exception as exc:
        logger.exception(
            "Gemini request failed while parsing recipe text. model=%s",
            MODEL_NAME,
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=failure_detail,
        ) from exc

    raw_text = _extract_response_text(response)
    logger.info("Gemini parse response preview=%s", raw_text[:500])

    try:
        return _load_recipe_json(raw_text)
    except (json.JSONDecodeError, ValueError) as exc:
        logger.exception("Gemini returned malformed JSON.")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=malformed_detail,
        ) from exc


def _build_nutrition_prompt(recipe: ParsedRecipe) -> str:
    ingredients_lines = [
        f"- {ingredient.quantity}{f' {ingredient.unit}' if ingredient.unit else ''} {ingredient.item}"
        for ingredient in recipe.ingredients
    ]
    steps_lines = [f"{step.order}. {step.instruction}" for step in recipe.steps]

    description = recipe.description or "No description provided."

    return "\n".join(
        [
            f"Recipe title: {recipe.title}",
            f"Description: {description}",
            f"Servings: {recipe.servings}",
            "Ingredients:",
            *ingredients_lines,
            "Steps:",
            *steps_lines,
            "",
            "Estimate calories, protein, carbs, fat, and dietary flags per serving. Return JSON only.",
        ]
    )


def _extract_response_text(response: Any) -> str:
    text = getattr(response, "text", None)
    if text:
        return text.strip()

    parts: list[str] = []
    for candidate in getattr(response, "candidates", []) or []:
        content = getattr(candidate, "content", None)
        for part in getattr(content, "parts", []) or []:
            part_text = getattr(part, "text", None)
            if part_text:
                parts.append(part_text)

    if not parts:
        raise ValueError("Gemini response did not contain any text parts.")

    return "\n".join(parts).strip()


def _load_recipe_json(raw_text: str) -> dict[str, Any]:
    candidate = raw_text.strip()

    if candidate.startswith("```"):
        lines = candidate.splitlines()
        if lines:
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        candidate = "\n".join(lines).strip()

    start = candidate.find("{")
    end = candidate.rfind("}")
    if start == -1 or end == -1 or end < start:
        raise ValueError("Could not locate a JSON object in the Gemini response.")

    parsed = json.loads(candidate[start : end + 1])
    if not isinstance(parsed, dict):
        raise ValueError("Gemini response JSON root must be an object.")

    return parsed

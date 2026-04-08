import json
import logging
import os
from typing import Any

import httpx
from fastapi import HTTPException, status
from pydantic import ValidationError

from models.recipe import (
    Ingredient,
    IngredientSubstitutionOption,
    LocalizedRecipeResponse,
    Nutrition,
    ParseRecipeResponse,
    ParsedRecipe,
    SubstituteIngredientResponse,
)

logger = logging.getLogger(__name__)

MODEL_NAME = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

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

GENERATE_RECIPE_SYSTEM_PROMPT = """
You are a recipe generation engine.
Generate a complete, authentic recipe from just a dish name.

Return an object with exactly these keys:
- title: string
- description: string or null
- ingredients: array of objects with keys quantity, unit, item
- steps: array of objects with keys order, instruction
- servings: integer
- tags: array of strings

Rules:
- Generate an authentic, traditional recipe for the dish name provided.
- Include all necessary ingredients with accurate quantities.
- Provide clear, step-by-step cooking instructions.
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

SUBSTITUTION_SYSTEM_PROMPT = """
You are a recipe ingredient substitution engine.
Suggest practical substitutions for one ingredient within a specific dish.

Return an object with exactly these keys:
- substitutions: array of objects with keys name, reason, notes

Rules:
- Return 2 or 3 substitution options.
- Keep each option realistic for home cooks and relevant to the dish context.
- name should be concise.
- reason should explain why the swap works in this recipe.
- notes should mention ratio, flavor changes, or cooking cautions when useful, otherwise null.
- Do not include markdown fences, prose, comments, or extra keys.
""".strip()

LOCALIZATION_SYSTEM_PROMPT = """
You are a recipe localization engine.
Adapt a recipe for a specific region while preserving the spirit of the dish.

Return an object with exactly these keys:
- title: string
- description: string or null
- ingredients: array of objects with keys quantity, unit, item
- steps: array of objects with keys order, instruction
- servings: integer
- tags: array of strings

Rules:
- Keep the dish recognizable while adapting ingredients, seasonings, and terminology for the target region.
- Prefer ingredients and cooking references that feel familiar and accessible in that region.
- quantity must always be a string, even for fractions like "1/2".
- unit must be null when absent.
- item should contain the ingredient name and any clarifying prep note.
- steps must stay ordered starting at 1.
- servings must remain a positive integer and usually match the source recipe unless adaptation requires otherwise.
- tags should stay short lowercase labels.
- Do not include markdown fences, prose, comments, or extra keys.
""".strip()


def parser_status():
    return {
        "provider": "Groq",
        "ready": bool(os.getenv("GROQ_API_KEY")),
        "model": MODEL_NAME,
        "message": "Recipe parsing is available when GROQ_API_KEY is configured.",
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
        log_context=f"Parsing recipe text with Groq. chars={len(cleaned_text)}",
        failure_detail=f"Groq failed to parse the recipe text with model '{MODEL_NAME}'.",
    )


def generate_recipe_from_name(dish_name: str) -> ParseRecipeResponse:
    """Generate a complete recipe from just a dish name (e.g., 'githeri', 'pizza', 'biryani')."""
    cleaned_name = dish_name.strip()
    if not cleaned_name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Dish name is required.",
        )

    prompt = f"Generate a complete, authentic recipe for: {cleaned_name}"

    return _generate_recipe_response(
        prompt=prompt,
        system_prompt=GENERATE_RECIPE_SYSTEM_PROMPT,
        log_context=f"Generating recipe from dish name with Groq. dish={cleaned_name!r}",
        failure_detail=f"Groq failed to generate recipe for '{cleaned_name}' with model '{MODEL_NAME}'.",
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
            "Generating recipe from image labels with Groq. "
            f"dish={cleaned_dish} labels={cleaned_labels}"
        ),
        failure_detail=(
            f"Groq failed to generate a recipe from image labels with model '{MODEL_NAME}'."
        ),
    )


def estimate_nutrition(recipe: ParsedRecipe) -> Nutrition:
    prompt = _build_nutrition_prompt(recipe)

    payload = _generate_json_payload(
        prompt=prompt,
        system_prompt=NUTRITION_SYSTEM_PROMPT,
        log_context=(
            "Estimating recipe nutrition with Groq. "
            f"title={recipe.title!r} servings={recipe.servings}"
        ),
        failure_detail=(
            f"Groq failed to estimate recipe nutrition with model '{MODEL_NAME}'."
        ),
        malformed_detail="Groq returned malformed nutrition JSON.",
    )

    try:
        return Nutrition.model_validate(payload)
    except ValidationError as exc:
        logger.exception("Groq returned invalid nutrition payload.")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Groq returned malformed nutrition JSON.",
        ) from exc


def suggest_substitutions(
    ingredient: Ingredient,
    recipe_title: str,
    recipe_description: str | None = None,
    tags: list[str] | None = None,
) -> SubstituteIngredientResponse:
    cleaned_title = recipe_title.strip()
    if not cleaned_title:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Recipe title is required to suggest substitutions.",
        )

    prompt = _build_substitution_prompt(
        ingredient=ingredient,
        recipe_title=cleaned_title,
        recipe_description=recipe_description,
        tags=tags or [],
    )

    payload = _generate_json_payload(
        prompt=prompt,
        system_prompt=SUBSTITUTION_SYSTEM_PROMPT,
        log_context=(
            "Suggesting ingredient substitutions with Groq. "
            f"recipe_title={cleaned_title!r} ingredient={ingredient.item!r}"
        ),
        failure_detail=(
            f"Groq failed to suggest substitutions with model '{MODEL_NAME}'."
        ),
        malformed_detail="Groq returned malformed substitution JSON.",
    )

    raw_substitutions = payload.get("substitutions", [])
    if not isinstance(raw_substitutions, list):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Groq returned malformed substitution JSON.",
        )

    try:
        substitutions = [
            IngredientSubstitutionOption.model_validate(option)
            for option in raw_substitutions
        ]
    except ValidationError as exc:
        logger.exception("Groq returned invalid substitution payload.")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Groq returned malformed substitution JSON.",
        ) from exc

    return SubstituteIngredientResponse(
        ingredient=ingredient,
        substitutions=substitutions[:3],
    )


def localize_recipe(recipe: ParsedRecipe, region: str) -> LocalizedRecipeResponse:
    cleaned_region = region.strip()
    if not cleaned_region:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A target region is required to localize the recipe.",
        )

    prompt = _build_localization_prompt(recipe=recipe, region=cleaned_region)
    localized = _generate_recipe_response(
        prompt=prompt,
        system_prompt=LOCALIZATION_SYSTEM_PROMPT,
        log_context=(
            "Localizing recipe with Groq. "
            f"title={recipe.title!r} region={cleaned_region!r}"
        ),
        failure_detail=(
            f"Groq failed to localize the recipe with model '{MODEL_NAME}'."
        ),
    )

    return LocalizedRecipeResponse(region=cleaned_region, recipe=localized.recipe)


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
        malformed_detail="Groq returned malformed recipe JSON.",
    )

    try:
        recipe = ParsedRecipe.model_validate(payload)
    except ValidationError as exc:
        logger.exception("Groq returned invalid recipe payload.")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Groq returned malformed recipe JSON.",
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
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GROQ_API_KEY is not configured on the backend.",
        )

    logger.info(log_context)

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"{prompt}\n\nReturn your response as valid JSON."},
        ],
        "temperature": 0.2,
        "response_format": {"type": "json_object"},
    }

    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(GROQ_API_URL, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as exc:
        logger.exception(
            "Groq API request failed. status=%s",
            exc.response.status_code,
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=failure_detail,
        ) from exc
    except Exception as exc:
        logger.exception("Groq request failed. model=%s", MODEL_NAME)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=failure_detail,
        ) from exc

    try:
        raw_text = data["choices"][0]["message"]["content"]
        logger.info("Groq response preview=%s", raw_text[:500])
    except (KeyError, IndexError) as exc:
        logger.exception("Groq returned unexpected response structure.")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=malformed_detail,
        ) from exc

    try:
        return _load_recipe_json(raw_text)
    except (json.JSONDecodeError, ValueError) as exc:
        logger.exception("Groq returned malformed JSON.")
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


def _build_substitution_prompt(
    ingredient: Ingredient,
    recipe_title: str,
    recipe_description: str | None,
    tags: list[str],
) -> str:
    return "\n".join(
        [
            f"Recipe title: {recipe_title}",
            f"Recipe description: {recipe_description or 'No description provided.'}",
            f"Tags: {', '.join(tags) if tags else 'none'}",
            (
                "Ingredient to replace: "
                f"{ingredient.quantity}{f' {ingredient.unit}' if ingredient.unit else ''} {ingredient.item}"
            ),
            "",
            "Suggest 2 to 3 practical substitutions. Return JSON only.",
        ]
    )


def _build_localization_prompt(recipe: ParsedRecipe, region: str) -> str:
    ingredients_lines = [
        f"- {ingredient.quantity}{f' {ingredient.unit}' if ingredient.unit else ''} {ingredient.item}"
        for ingredient in recipe.ingredients
    ]
    steps_lines = [f"{step.order}. {step.instruction}" for step in recipe.steps]

    return "\n".join(
        [
            f"Target region: {region}",
            f"Recipe title: {recipe.title}",
            f"Description: {recipe.description or 'No description provided.'}",
            f"Servings: {recipe.servings}",
            f"Tags: {', '.join(recipe.tags) if recipe.tags else 'none'}",
            "Ingredients:",
            *ingredients_lines,
            "Steps:",
            *steps_lines,
            "",
            "Adapt this recipe for the target region. Return JSON only.",
        ]
    )


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
        raise ValueError("Could not locate a JSON object in the Groq response.")

    parsed = json.loads(candidate[start : end + 1])
    if not isinstance(parsed, dict):
        raise ValueError("Groq response JSON root must be an object.")

    return parsed

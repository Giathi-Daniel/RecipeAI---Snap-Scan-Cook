import os
from typing import Any

import httpx
from fastapi import HTTPException, status

from models.recipe import Recipe, SavedRecipe


def _get_supabase_env() -> tuple[str, str]:
    supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")
    anon_key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY") or os.getenv("SUPABASE_ANON_KEY")

    if not supabase_url or not anon_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase URL or anon key is not configured on the backend.",
        )

    return supabase_url.rstrip("/"), anon_key


async def insert_recipe(recipe_payload: dict[str, Any], access_token: str) -> Recipe:
    supabase_url, anon_key = _get_supabase_env()

    headers = {
        "apikey": anon_key,
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(
            f"{supabase_url}/rest/v1/recipes",
            headers=headers,
            json=recipe_payload,
        )

    if response.is_success:
        rows = response.json()
        if not rows:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Supabase returned no recipe row after insert.",
            )
        return Recipe.model_validate(rows[0])

    raise HTTPException(
        status_code=response.status_code,
        detail=_extract_supabase_error(response),
    )


async def insert_saved_recipe(saved_recipe_payload: dict[str, Any], access_token: str) -> SavedRecipe:
    supabase_url, anon_key = _get_supabase_env()

    headers = {
        "apikey": anon_key,
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(
            f"{supabase_url}/rest/v1/saved_recipes",
            headers=headers,
            json=saved_recipe_payload,
        )

    if response.is_success:
        rows = response.json()
        if not rows:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Supabase returned no saved recipe row after insert.",
            )
        return SavedRecipe.model_validate(rows[0])

    raise HTTPException(
        status_code=response.status_code,
        detail=_extract_supabase_error(response),
    )


def _extract_supabase_error(response: httpx.Response) -> str:
    try:
        payload = response.json()
    except ValueError:
        return "Supabase request failed."

    return (
        payload.get("message")
        or payload.get("error_description")
        or payload.get("hint")
        or "Supabase request failed."
    )

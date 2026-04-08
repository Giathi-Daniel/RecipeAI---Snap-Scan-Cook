from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status
from supabase import create_client

from models.collection import Collection


async def get_supabase_client(access_token: str):
    """Create authenticated Supabase client."""
    import os

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase configuration is missing",
        )

    client = create_client(supabase_url, supabase_key)
    client.auth.set_session(access_token, "")
    return client


async def create_collection(
    user_id: str, name: str, description: Optional[str], access_token: str
) -> Collection:
    """Create a new collection for a user."""
    client = await get_supabase_client(access_token)

    try:
        response = (
            client.table("collections")
            .insert(
                {
                    "user_id": user_id,
                    "name": name,
                    "description": description,
                }
            )
            .execute()
        )

        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create collection",
            )

        collection_data = response.data[0]
        return Collection(**collection_data, recipe_count=0)

    except Exception as e:
        if "duplicate key" in str(e).lower() or "unique" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Collection with name '{name}' already exists",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create collection: {str(e)}",
        )


async def get_user_collections(user_id: str, access_token: str) -> list[Collection]:
    """Get all collections for a user with recipe counts."""
    client = await get_supabase_client(access_token)

    try:
        response = (
            client.table("collections")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )

        collections = []
        for collection_data in response.data:
            # Get recipe count for each collection
            count_response = (
                client.table("recipe_collections")
                .select("id", count="exact")
                .eq("collection_id", collection_data["id"])
                .execute()
            )

            recipe_count = count_response.count if count_response.count else 0

            collections.append(
                Collection(**collection_data, recipe_count=recipe_count)
            )

        return collections

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch collections: {str(e)}",
        )


async def get_collection_by_id(
    collection_id: str, user_id: str, access_token: str
) -> Collection:
    """Get a specific collection by ID."""
    client = await get_supabase_client(access_token)

    try:
        response = (
            client.table("collections")
            .select("*")
            .eq("id", collection_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Collection not found",
            )

        # Get recipe count
        count_response = (
            client.table("recipe_collections")
            .select("id", count="exact")
            .eq("collection_id", collection_id)
            .execute()
        )

        recipe_count = count_response.count if count_response.count else 0

        return Collection(**response.data, recipe_count=recipe_count)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch collection: {str(e)}",
        )


async def update_collection(
    collection_id: str,
    user_id: str,
    name: Optional[str],
    description: Optional[str],
    access_token: str,
) -> Collection:
    """Update a collection."""
    client = await get_supabase_client(access_token)

    try:
        # Build update data
        update_data = {}
        if name is not None:
            update_data["name"] = name
        if description is not None:
            update_data["description"] = description

        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update",
            )

        response = (
            client.table("collections")
            .update(update_data)
            .eq("id", collection_id)
            .eq("user_id", user_id)
            .execute()
        )

        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Collection not found",
            )

        # Get recipe count
        count_response = (
            client.table("recipe_collections")
            .select("id", count="exact")
            .eq("collection_id", collection_id)
            .execute()
        )

        recipe_count = count_response.count if count_response.count else 0

        return Collection(**response.data[0], recipe_count=recipe_count)

    except HTTPException:
        raise
    except Exception as e:
        if "duplicate key" in str(e).lower() or "unique" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Collection with name '{name}' already exists",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update collection: {str(e)}",
        )


async def delete_collection(
    collection_id: str, user_id: str, access_token: str
) -> bool:
    """Delete a collection."""
    client = await get_supabase_client(access_token)

    try:
        response = (
            client.table("collections")
            .delete()
            .eq("id", collection_id)
            .eq("user_id", user_id)
            .execute()
        )

        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Collection not found",
            )

        return True

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to delete collection: {str(e)}",
        )


async def add_recipe_to_collection(
    collection_id: str, recipe_id: str, user_id: str, access_token: str
) -> dict:
    """Add a recipe to a collection."""
    client = await get_supabase_client(access_token)

    try:
        # Verify collection belongs to user
        collection = await get_collection_by_id(collection_id, user_id, access_token)
        if not collection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Collection not found",
            )

        # Add recipe to collection
        response = (
            client.table("recipe_collections")
            .insert(
                {
                    "collection_id": collection_id,
                    "recipe_id": recipe_id,
                }
            )
            .execute()
        )

        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to add recipe to collection",
            )

        return response.data[0]

    except HTTPException:
        raise
    except Exception as e:
        if "duplicate key" in str(e).lower() or "unique" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Recipe already exists in this collection",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to add recipe to collection: {str(e)}",
        )


async def remove_recipe_from_collection(
    collection_id: str, recipe_id: str, user_id: str, access_token: str
) -> bool:
    """Remove a recipe from a collection."""
    client = await get_supabase_client(access_token)

    try:
        # Verify collection belongs to user
        collection = await get_collection_by_id(collection_id, user_id, access_token)
        if not collection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Collection not found",
            )

        # Remove recipe from collection
        response = (
            client.table("recipe_collections")
            .delete()
            .eq("collection_id", collection_id)
            .eq("recipe_id", recipe_id)
            .execute()
        )

        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recipe not found in collection",
            )

        return True

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to remove recipe from collection: {str(e)}",
        )


async def get_collection_recipes(
    collection_id: str, user_id: str, access_token: str
) -> list[str]:
    """Get all recipe IDs in a collection."""
    client = await get_supabase_client(access_token)

    try:
        # Verify collection belongs to user
        collection = await get_collection_by_id(collection_id, user_id, access_token)
        if not collection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Collection not found",
            )

        response = (
            client.table("recipe_collections")
            .select("recipe_id")
            .eq("collection_id", collection_id)
            .execute()
        )

        return [item["recipe_id"] for item in response.data]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch collection recipes: {str(e)}",
        )

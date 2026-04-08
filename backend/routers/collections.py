from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status

from models.collection import (
    AddRecipeToCollectionRequest,
    AddRecipeToCollectionResponse,
    CollectionResponse,
    CollectionsListResponse,
    CreateCollectionRequest,
    RemoveRecipeFromCollectionRequest,
    RemoveRecipeFromCollectionResponse,
    UpdateCollectionRequest,
)
from services.auth_service import get_current_user
from services.collection_service import (
    add_recipe_to_collection,
    create_collection,
    delete_collection,
    get_collection_by_id,
    get_collection_recipes,
    get_user_collections,
    remove_recipe_from_collection,
    update_collection,
)

router = APIRouter()


@router.post("/", response_model=CollectionResponse, status_code=status.HTTP_201_CREATED)
async def create_collection_route(
    request: Request,
    payload: CreateCollectionRequest,
    current_user: dict = Depends(get_current_user),
):
    """Create a new collection."""
    access_token = getattr(request.state, "access_token", None)

    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="A valid Supabase access token is required",
        )

    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in token",
        )

    collection = await create_collection(
        user_id=user_id,
        name=payload.name,
        description=payload.description,
        access_token=access_token,
    )

    return CollectionResponse(collection=collection)


@router.get("/", response_model=CollectionsListResponse)
async def get_collections_route(
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    """Get all collections for the current user."""
    access_token = getattr(request.state, "access_token", None)

    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="A valid Supabase access token is required",
        )

    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in token",
        )

    collections = await get_user_collections(
        user_id=user_id,
        access_token=access_token,
    )

    return CollectionsListResponse(collections=collections, total=len(collections))


@router.get("/{collection_id}", response_model=CollectionResponse)
async def get_collection_route(
    collection_id: UUID,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    """Get a specific collection by ID."""
    access_token = getattr(request.state, "access_token", None)

    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="A valid Supabase access token is required",
        )

    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in token",
        )

    collection = await get_collection_by_id(
        collection_id=str(collection_id),
        user_id=user_id,
        access_token=access_token,
    )

    return CollectionResponse(collection=collection)


@router.patch("/{collection_id}", response_model=CollectionResponse)
async def update_collection_route(
    collection_id: UUID,
    request: Request,
    payload: UpdateCollectionRequest,
    current_user: dict = Depends(get_current_user),
):
    """Update a collection."""
    access_token = getattr(request.state, "access_token", None)

    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="A valid Supabase access token is required",
        )

    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in token",
        )

    collection = await update_collection(
        collection_id=str(collection_id),
        user_id=user_id,
        name=payload.name,
        description=payload.description,
        access_token=access_token,
    )

    return CollectionResponse(collection=collection)


@router.delete("/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_collection_route(
    collection_id: UUID,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    """Delete a collection."""
    access_token = getattr(request.state, "access_token", None)

    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="A valid Supabase access token is required",
        )

    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in token",
        )

    await delete_collection(
        collection_id=str(collection_id),
        user_id=user_id,
        access_token=access_token,
    )


@router.post("/recipes/add", response_model=AddRecipeToCollectionResponse)
async def add_recipe_to_collection_route(
    request: Request,
    payload: AddRecipeToCollectionRequest,
    current_user: dict = Depends(get_current_user),
):
    """Add a recipe to a collection."""
    access_token = getattr(request.state, "access_token", None)

    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="A valid Supabase access token is required",
        )

    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in token",
        )

    result = await add_recipe_to_collection(
        collection_id=str(payload.collection_id),
        recipe_id=str(payload.recipe_id),
        user_id=user_id,
        access_token=access_token,
    )

    return AddRecipeToCollectionResponse(
        collection_id=result["collection_id"],
        recipe_id=result["recipe_id"],
        added_at=result["added_at"],
    )


@router.post("/recipes/remove", response_model=RemoveRecipeFromCollectionResponse)
async def remove_recipe_from_collection_route(
    request: Request,
    payload: RemoveRecipeFromCollectionRequest,
    current_user: dict = Depends(get_current_user),
):
    """Remove a recipe from a collection."""
    access_token = getattr(request.state, "access_token", None)

    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="A valid Supabase access token is required",
        )

    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in token",
        )

    await remove_recipe_from_collection(
        collection_id=str(payload.collection_id),
        recipe_id=str(payload.recipe_id),
        user_id=user_id,
        access_token=access_token,
    )

    return RemoveRecipeFromCollectionResponse(
        success=True,
        message="Recipe removed from collection successfully",
    )


@router.get("/{collection_id}/recipes")
async def get_collection_recipes_route(
    collection_id: UUID,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    """Get all recipe IDs in a collection."""
    access_token = getattr(request.state, "access_token", None)

    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="A valid Supabase access token is required",
        )

    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in token",
        )

    recipe_ids = await get_collection_recipes(
        collection_id=str(collection_id),
        user_id=user_id,
        access_token=access_token,
    )

    return {"collection_id": collection_id, "recipe_ids": recipe_ids, "total": len(recipe_ids)}

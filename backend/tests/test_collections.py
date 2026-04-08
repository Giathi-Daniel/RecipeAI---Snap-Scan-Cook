import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from fastapi import HTTPException

from models.collection import (
    Collection,
    CreateCollectionRequest,
    UpdateCollectionRequest,
)
from services.collection_service import (
    create_collection,
    get_user_collections,
    get_collection_by_id,
    update_collection,
    delete_collection,
    add_recipe_to_collection,
    remove_recipe_from_collection,
    get_collection_recipes,
)


@pytest.fixture
def mock_supabase_client():
    """Mock Supabase client."""
    client = MagicMock()
    client.auth.set_session = MagicMock()
    return client


@pytest.fixture
def sample_collection_data():
    """Sample collection data."""
    return {
        "id": str(uuid4()),
        "user_id": str(uuid4()),
        "name": "Weeknight Dinners",
        "description": "Quick and easy meals for busy weeknights",
        "created_at": "2026-04-08T10:00:00Z",
        "updated_at": "2026-04-08T10:00:00Z",
    }


@pytest.mark.asyncio
async def test_create_collection_success(mock_supabase_client, sample_collection_data):
    """Test successful collection creation."""
    with patch(
        "services.collection_service.get_supabase_client",
        return_value=mock_supabase_client,
    ):
        mock_response = MagicMock()
        mock_response.data = [sample_collection_data]
        mock_supabase_client.table.return_value.insert.return_value.execute.return_value = (
            mock_response
        )

        collection = await create_collection(
            user_id=sample_collection_data["user_id"],
            name=sample_collection_data["name"],
            description=sample_collection_data["description"],
            access_token="test_token",
        )

        assert collection.name == "Weeknight Dinners"
        assert collection.description == "Quick and easy meals for busy weeknights"
        assert collection.recipe_count == 0


@pytest.mark.asyncio
async def test_create_collection_duplicate_name(mock_supabase_client):
    """Test creating collection with duplicate name."""
    with patch(
        "services.collection_service.get_supabase_client",
        return_value=mock_supabase_client,
    ):
        mock_supabase_client.table.return_value.insert.return_value.execute.side_effect = (
            Exception("duplicate key value violates unique constraint")
        )

        with pytest.raises(HTTPException) as exc_info:
            await create_collection(
                user_id=str(uuid4()),
                name="Weeknight Dinners",
                description="Test",
                access_token="test_token",
            )

        assert exc_info.value.status_code == 409
        assert "already exists" in exc_info.value.detail


@pytest.mark.asyncio
async def test_create_collection_empty_name():
    """Test creating collection with empty name."""
    with pytest.raises(ValueError):
        CreateCollectionRequest(name="", description="Test")


@pytest.mark.asyncio
async def test_create_collection_name_too_long():
    """Test creating collection with name exceeding max length."""
    long_name = "a" * 101
    # Should raise validation error
    with pytest.raises(Exception):  # Pydantic ValidationError
        CreateCollectionRequest(name=long_name, description="Test")


@pytest.mark.asyncio
async def test_get_user_collections(mock_supabase_client, sample_collection_data):
    """Test fetching user collections."""
    with patch(
        "services.collection_service.get_supabase_client",
        return_value=mock_supabase_client,
    ):
        mock_response = MagicMock()
        mock_response.data = [sample_collection_data]
        mock_supabase_client.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = (
            mock_response
        )

        # Mock recipe count
        count_response = MagicMock()
        count_response.count = 5
        mock_supabase_client.table.return_value.select.return_value.eq.return_value.execute.return_value = (
            count_response
        )

        collections = await get_user_collections(
            user_id=sample_collection_data["user_id"],
            access_token="test_token",
        )

        assert len(collections) == 1
        assert collections[0].name == "Weeknight Dinners"
        assert collections[0].recipe_count == 5


@pytest.mark.asyncio
async def test_get_collection_by_id(mock_supabase_client, sample_collection_data):
    """Test fetching a specific collection."""
    with patch(
        "services.collection_service.get_supabase_client",
        return_value=mock_supabase_client,
    ):
        mock_response = MagicMock()
        mock_response.data = sample_collection_data
        mock_supabase_client.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.return_value = (
            mock_response
        )

        # Mock recipe count
        count_response = MagicMock()
        count_response.count = 3
        mock_supabase_client.table.return_value.select.return_value.eq.return_value.execute.return_value = (
            count_response
        )

        collection = await get_collection_by_id(
            collection_id=sample_collection_data["id"],
            user_id=sample_collection_data["user_id"],
            access_token="test_token",
        )

        assert collection.name == "Weeknight Dinners"
        assert collection.recipe_count == 3


@pytest.mark.asyncio
async def test_get_collection_not_found(mock_supabase_client):
    """Test fetching non-existent collection."""
    with patch(
        "services.collection_service.get_supabase_client",
        return_value=mock_supabase_client,
    ):
        mock_response = MagicMock()
        mock_response.data = None
        mock_supabase_client.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.return_value = (
            mock_response
        )

        with pytest.raises(HTTPException) as exc_info:
            await get_collection_by_id(
                collection_id=str(uuid4()),
                user_id=str(uuid4()),
                access_token="test_token",
            )

        assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_update_collection(mock_supabase_client, sample_collection_data):
    """Test updating a collection."""
    with patch(
        "services.collection_service.get_supabase_client",
        return_value=mock_supabase_client,
    ):
        updated_data = sample_collection_data.copy()
        updated_data["name"] = "Updated Name"

        mock_response = MagicMock()
        mock_response.data = [updated_data]
        mock_supabase_client.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value = (
            mock_response
        )

        # Mock recipe count
        count_response = MagicMock()
        count_response.count = 2
        mock_supabase_client.table.return_value.select.return_value.eq.return_value.execute.return_value = (
            count_response
        )

        collection = await update_collection(
            collection_id=sample_collection_data["id"],
            user_id=sample_collection_data["user_id"],
            name="Updated Name",
            description=None,
            access_token="test_token",
        )

        assert collection.name == "Updated Name"


@pytest.mark.asyncio
async def test_update_collection_no_fields():
    """Test updating collection with no fields."""
    with patch("services.collection_service.get_supabase_client"):
        with pytest.raises(HTTPException) as exc_info:
            await update_collection(
                collection_id=str(uuid4()),
                user_id=str(uuid4()),
                name=None,
                description=None,
                access_token="test_token",
            )

        assert exc_info.value.status_code == 400
        assert "No fields to update" in exc_info.value.detail


@pytest.mark.asyncio
async def test_delete_collection(mock_supabase_client, sample_collection_data):
    """Test deleting a collection."""
    with patch(
        "services.collection_service.get_supabase_client",
        return_value=mock_supabase_client,
    ):
        mock_response = MagicMock()
        mock_response.data = [sample_collection_data]
        mock_supabase_client.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value = (
            mock_response
        )

        result = await delete_collection(
            collection_id=sample_collection_data["id"],
            user_id=sample_collection_data["user_id"],
            access_token="test_token",
        )

        assert result is True


@pytest.mark.asyncio
async def test_add_recipe_to_collection(mock_supabase_client, sample_collection_data):
    """Test adding a recipe to a collection."""
    recipe_id = str(uuid4())

    with patch(
        "services.collection_service.get_supabase_client",
        return_value=mock_supabase_client,
    ):
        # Mock get_collection_by_id
        with patch(
            "services.collection_service.get_collection_by_id",
            return_value=Collection(**sample_collection_data, recipe_count=0),
        ):
            recipe_collection_data = {
                "id": str(uuid4()),
                "collection_id": sample_collection_data["id"],
                "recipe_id": recipe_id,
                "added_at": "2026-04-08T10:00:00Z",
            }

            mock_response = MagicMock()
            mock_response.data = [recipe_collection_data]
            mock_supabase_client.table.return_value.insert.return_value.execute.return_value = (
                mock_response
            )

            result = await add_recipe_to_collection(
                collection_id=sample_collection_data["id"],
                recipe_id=recipe_id,
                user_id=sample_collection_data["user_id"],
                access_token="test_token",
            )

            assert result["recipe_id"] == recipe_id
            assert result["collection_id"] == sample_collection_data["id"]


@pytest.mark.asyncio
async def test_add_recipe_duplicate(mock_supabase_client, sample_collection_data):
    """Test adding duplicate recipe to collection."""
    recipe_id = str(uuid4())

    with patch(
        "services.collection_service.get_supabase_client",
        return_value=mock_supabase_client,
    ):
        with patch(
            "services.collection_service.get_collection_by_id",
            return_value=Collection(**sample_collection_data, recipe_count=0),
        ):
            mock_supabase_client.table.return_value.insert.return_value.execute.side_effect = (
                Exception("duplicate key value violates unique constraint")
            )

            with pytest.raises(HTTPException) as exc_info:
                await add_recipe_to_collection(
                    collection_id=sample_collection_data["id"],
                    recipe_id=recipe_id,
                    user_id=sample_collection_data["user_id"],
                    access_token="test_token",
                )

            assert exc_info.value.status_code == 409
            assert "already exists" in exc_info.value.detail


@pytest.mark.asyncio
async def test_remove_recipe_from_collection(mock_supabase_client, sample_collection_data):
    """Test removing a recipe from a collection."""
    recipe_id = str(uuid4())

    with patch(
        "services.collection_service.get_supabase_client",
        return_value=mock_supabase_client,
    ):
        with patch(
            "services.collection_service.get_collection_by_id",
            return_value=Collection(**sample_collection_data, recipe_count=1),
        ):
            mock_response = MagicMock()
            mock_response.data = [{"id": str(uuid4())}]
            mock_supabase_client.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value = (
                mock_response
            )

            result = await remove_recipe_from_collection(
                collection_id=sample_collection_data["id"],
                recipe_id=recipe_id,
                user_id=sample_collection_data["user_id"],
                access_token="test_token",
            )

            assert result is True


@pytest.mark.asyncio
async def test_get_collection_recipes(mock_supabase_client, sample_collection_data):
    """Test getting all recipes in a collection."""
    recipe_ids = [str(uuid4()), str(uuid4()), str(uuid4())]

    with patch(
        "services.collection_service.get_supabase_client",
        return_value=mock_supabase_client,
    ):
        with patch(
            "services.collection_service.get_collection_by_id",
            return_value=Collection(**sample_collection_data, recipe_count=3),
        ):
            mock_response = MagicMock()
            mock_response.data = [{"recipe_id": rid} for rid in recipe_ids]
            mock_supabase_client.table.return_value.select.return_value.eq.return_value.execute.return_value = (
                mock_response
            )

            result = await get_collection_recipes(
                collection_id=sample_collection_data["id"],
                user_id=sample_collection_data["user_id"],
                access_token="test_token",
            )

            assert len(result) == 3
            assert all(rid in result for rid in recipe_ids)


@pytest.mark.asyncio
async def test_collection_name_sanitization():
    """Test that collection names are properly sanitized."""
    # Test with special characters and extra spaces
    request = CreateCollectionRequest(
        name="  Test   Collection\x00Name  ",
        description="Test description",
    )

    assert request.name == "Test Collection Name"
    assert "\x00" not in request.name


@pytest.mark.asyncio
async def test_collection_description_sanitization():
    """Test that descriptions are properly sanitized."""
    request = CreateCollectionRequest(
        name="Test",
        description="  Test   description\x00with   spaces  ",
    )

    assert request.description == "Test description with spaces"
    assert "\x00" not in request.description


@pytest.mark.asyncio
async def test_update_collection_validation():
    """Test update request validation."""
    # Valid update with name only
    request = UpdateCollectionRequest(name="New Name")
    assert request.name == "New Name"
    assert request.description is None

    # Valid update with description only
    request = UpdateCollectionRequest(description="New description")
    assert request.name is None
    assert request.description == "New description"

    # Valid update with both
    request = UpdateCollectionRequest(name="New Name", description="New description")
    assert request.name == "New Name"
    assert request.description == "New description"

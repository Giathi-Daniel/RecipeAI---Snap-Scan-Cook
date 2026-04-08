from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


def sanitize_text(value: str, max_length: int = 1000) -> str:
    cleaned = " ".join(value.replace("\x00", " ").split())
    return cleaned.strip()[:max_length]


class Collection(BaseModel):
    id: Optional[UUID] = None
    user_id: UUID
    name: str
    description: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    recipe_count: Optional[int] = 0

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        cleaned = sanitize_text(value, max_length=100)
        if not cleaned or len(cleaned) < 1:
            raise ValueError("Collection name must be at least 1 character")
        return cleaned

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        return sanitize_text(value, max_length=500) or None


class CreateCollectionRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        cleaned = sanitize_text(value, max_length=100)
        if not cleaned or len(cleaned) < 1:
            raise ValueError("Collection name must be at least 1 character")
        return cleaned

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        return sanitize_text(value, max_length=500) or None


class UpdateCollectionRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        cleaned = sanitize_text(value, max_length=100)
        if not cleaned or len(cleaned) < 1:
            raise ValueError("Collection name must be at least 1 character")
        return cleaned

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        return sanitize_text(value, max_length=500) or None


class CollectionResponse(BaseModel):
    collection: Collection


class CollectionsListResponse(BaseModel):
    collections: list[Collection]
    total: int


class AddRecipeToCollectionRequest(BaseModel):
    recipe_id: UUID
    collection_id: UUID


class AddRecipeToCollectionResponse(BaseModel):
    collection_id: UUID
    recipe_id: UUID
    added_at: datetime


class RemoveRecipeFromCollectionRequest(BaseModel):
    recipe_id: UUID
    collection_id: UUID


class RemoveRecipeFromCollectionResponse(BaseModel):
    success: bool
    message: str

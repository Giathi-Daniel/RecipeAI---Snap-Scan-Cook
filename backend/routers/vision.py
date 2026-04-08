from fastapi import APIRouter, File, HTTPException, UploadFile, status

from models.recipe import VisionIdentifyResponse
from services.deepseek_service import generate_recipe_from_dish_labels
from services.vision_service import identify_dish

router = APIRouter()
MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


def _looks_like_supported_image(image_bytes: bytes) -> bool:
    return (
        image_bytes.startswith(b"\xff\xd8\xff")
        or image_bytes.startswith(b"\x89PNG\r\n\x1a\n")
        or image_bytes.startswith(b"GIF87a")
        or image_bytes.startswith(b"GIF89a")
        or image_bytes.startswith(b"RIFF")
    )


@router.post("/identify", response_model=VisionIdentifyResponse)
async def identify_dish_from_image(file: UploadFile = File(...)):
    if not file.content_type or file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Upload a JPG, PNG, WEBP, or GIF image.",
        )

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Uploaded image is empty.",
        )

    if len(image_bytes) > MAX_IMAGE_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Upload an image smaller than 5 MB.",
        )

    if not _looks_like_supported_image(image_bytes):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Uploaded image content does not match a supported image format.",
        )

    dish_name, labels = identify_dish(image_bytes)
    recipe_response = generate_recipe_from_dish_labels(labels=labels, dish_name=dish_name)

    return VisionIdentifyResponse(
        dish_name=dish_name,
        labels=labels,
        recipe=recipe_response.recipe,
        raw_response=recipe_response.raw_response,
    )

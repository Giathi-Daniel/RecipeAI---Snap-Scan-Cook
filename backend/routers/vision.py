from fastapi import APIRouter, File, HTTPException, UploadFile, status

from models.recipe import VisionIdentifyResponse
from services.gemini_service import generate_recipe_from_dish_labels
from services.vision_service import identify_dish

router = APIRouter()


@router.post("/identify", response_model=VisionIdentifyResponse)
async def identify_dish_from_image(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Upload a valid image file.",
        )

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Uploaded image is empty.",
        )

    dish_name, labels = identify_dish(image_bytes)
    recipe_response = generate_recipe_from_dish_labels(labels=labels, dish_name=dish_name)

    return VisionIdentifyResponse(
        dish_name=dish_name,
        labels=labels,
        recipe=recipe_response.recipe,
        raw_response=recipe_response.raw_response,
    )

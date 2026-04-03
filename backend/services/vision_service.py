import logging
import os

from fastapi import HTTPException, status
from google.api_core import exceptions as google_exceptions
from google.cloud import vision

logger = logging.getLogger(__name__)

GENERIC_LABELS = {
    "food",
    "dish",
    "cuisine",
    "ingredient",
    "recipe",
    "tableware",
    "table",
    "plate",
    "meal",
}


def vision_status():
    return {
        "provider": "Google Cloud Vision",
        "ready": bool(os.getenv("GOOGLE_APPLICATION_CREDENTIALS")),
        "message": "Dish identification is available when Google Cloud Vision credentials are configured.",
    }


def identify_dish(image_bytes: bytes) -> tuple[str, list[str]]:
    if not image_bytes:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Image bytes are required for dish identification.",
        )

    if not os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GOOGLE_APPLICATION_CREDENTIALS is not configured on the backend.",
        )

    try:
        client = vision.ImageAnnotatorClient()
        response = client.label_detection(image=vision.Image(content=image_bytes))
    except Exception as exc:
        logger.exception("Google Cloud Vision request failed.")
        detail = _extract_google_error_message(exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=detail,
        ) from exc

    if response.error.message:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=response.error.message,
        )

    labels = _extract_top_labels(response.label_annotations)
    if not labels:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Google Cloud Vision did not return any useful food labels for this image.",
        )

    dish_name = _select_dish_name(labels)
    logger.info("Vision identified dish=%s labels=%s", dish_name, labels)
    return dish_name, labels


def _extract_top_labels(label_annotations: list[vision.EntityAnnotation]) -> list[str]:
    unique_labels: list[str] = []
    seen: set[str] = set()

    for annotation in sorted(label_annotations, key=lambda item: item.score or 0, reverse=True):
        if not annotation.description or (annotation.score or 0) < 0.55:
            continue

        label = annotation.description.strip()
        normalized = label.casefold()
        if normalized in seen:
            continue
        seen.add(normalized)
        unique_labels.append(label)
        if len(unique_labels) == 5:
            break

    return unique_labels


def _select_dish_name(labels: list[str]) -> str:
    for label in labels:
        if label.casefold() not in GENERIC_LABELS:
            return label

    return labels[0]


def _extract_google_error_message(exc: Exception) -> str:
    if isinstance(exc, google_exceptions.PermissionDenied):
        return str(exc)

    if isinstance(exc, google_exceptions.GoogleAPICallError):
        return str(exc)

    return "Google Cloud Vision failed to identify the uploaded image."

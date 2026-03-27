from fastapi import APIRouter

router = APIRouter()


@router.post("/identify")
def identify_dish_placeholder():
    return {
        "message": "Image recognition will be implemented on Day 6.",
        "labels": [],
    }

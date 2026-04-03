import unittest

from google.api_core import exceptions as google_exceptions

from services.vision_service import (
    _extract_google_error_message,
    _extract_top_labels,
    _select_dish_name,
)


class FakeAnnotation:
    def __init__(self, description: str, score: float):
        self.description = description
        self.score = score


class VisionServiceTests(unittest.TestCase):
    def test_extract_top_labels_keeps_high_confidence_unique_labels(self):
        annotations = [
            FakeAnnotation("Food", 0.98),
            FakeAnnotation("Food", 0.91),
            FakeAnnotation("Pilaf", 0.88),
            FakeAnnotation("Rice", 0.80),
            FakeAnnotation("Plate", 0.79),
            FakeAnnotation("Low score", 0.20),
        ]

        labels = _extract_top_labels(annotations)

        self.assertEqual(labels, ["Food", "Pilaf", "Rice", "Plate"])

    def test_select_dish_name_skips_generic_food_terms(self):
        dish_name = _select_dish_name(["Food", "Plate", "Jollof rice"])

        self.assertEqual(dish_name, "Jollof rice")

    def test_extract_google_error_message_preserves_provider_details(self):
        error = google_exceptions.PermissionDenied("Billing disabled for this project.")

        self.assertIn("Billing disabled", _extract_google_error_message(error))


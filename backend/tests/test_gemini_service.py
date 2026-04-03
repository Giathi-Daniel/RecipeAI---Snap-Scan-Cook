import unittest

from services.gemini_service import _load_recipe_json


class GeminiJsonParsingTests(unittest.TestCase):
    def test_load_recipe_json_handles_markdown_fences(self):
        payload = _load_recipe_json(
            """```json
            {
              "title": "Pilau",
              "description": "Spiced rice",
              "ingredients": [],
              "steps": [],
              "servings": 4,
              "tags": ["rice"]
            }
            ```"""
        )

        self.assertEqual(payload["title"], "Pilau")
        self.assertEqual(payload["servings"], 4)

    def test_load_recipe_json_rejects_missing_object(self):
        with self.assertRaises(ValueError):
            _load_recipe_json("no json here")


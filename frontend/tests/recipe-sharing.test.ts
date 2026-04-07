import test from "node:test";
import assert from "node:assert/strict";

import { buildRecipeUrl } from "../lib/recipe-sharing";

test("buildRecipeUrl appends recipe path to configured site url", () => {
  assert.equal(
    buildRecipeUrl("abc-123", "https://recipeai.example.com"),
    "https://recipeai.example.com/recipe/abc-123",
  );
});

test("buildRecipeUrl handles trailing slash on site url", () => {
  assert.equal(
    buildRecipeUrl("abc-123", "https://recipeai.example.com/"),
    "https://recipeai.example.com/recipe/abc-123",
  );
});

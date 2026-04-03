import test from "node:test";
import assert from "node:assert/strict";

import {
  MAX_IMAGE_UPLOAD_BYTES,
  validateImageUpload,
  validateRecipeText,
} from "../lib/upload-validation";

test("validateRecipeText rejects empty recipe text", () => {
  assert.equal(validateRecipeText("   "), "Paste a recipe first so we have something to parse.");
});

test("validateRecipeText accepts non-empty recipe text", () => {
  assert.equal(validateRecipeText("Beans stew"), null);
});

test("validateImageUpload requires a file", () => {
  assert.equal(validateImageUpload(null), "Choose an image first so we can identify the dish.");
});

test("validateImageUpload rejects non-image files", () => {
  assert.equal(
    validateImageUpload({ type: "text/plain", size: 100 }),
    "Upload a valid image file.",
  );
});

test("validateImageUpload rejects oversized images", () => {
  assert.equal(
    validateImageUpload({ type: "image/png", size: MAX_IMAGE_UPLOAD_BYTES + 1 }),
    "Upload an image smaller than 5 MB.",
  );
});

test("validateImageUpload accepts supported image payloads", () => {
  assert.equal(validateImageUpload({ type: "image/jpeg", size: 1024 }), null);
});

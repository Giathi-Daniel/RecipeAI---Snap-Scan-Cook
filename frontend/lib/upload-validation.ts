export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_RECIPE_TEXT_LENGTH = 10000;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

type UploadCandidate = {
  size: number;
  type: string;
  name?: string;
};

export function validateRecipeText(text: string): string | null {
  if (!text.trim()) {
    return "Paste a recipe first so we have something to parse.";
  }

  if (text.length > MAX_RECIPE_TEXT_LENGTH) {
    return "Keep recipe text under 10,000 characters.";
  }

  return null;
}

export function validateImageUpload(file: UploadCandidate | null): string | null {
  if (!file) {
    return "Choose an image first so we can identify the dish.";
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return "Upload a JPG, PNG, WEBP, or GIF image.";
  }

  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    return "Upload an image smaller than 5 MB.";
  }

  if (file.name && /[<>:"\\|?*\u0000-\u001F]/.test(file.name)) {
    return "Rename the image to remove unsupported filename characters.";
  }

  return null;
}

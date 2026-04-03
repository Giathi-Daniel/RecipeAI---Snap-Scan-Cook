export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

type UploadCandidate = {
  size: number;
  type: string;
};

export function validateRecipeText(text: string): string | null {
  if (!text.trim()) {
    return "Paste a recipe first so we have something to parse.";
  }

  return null;
}

export function validateImageUpload(file: UploadCandidate | null): string | null {
  if (!file) {
    return "Choose an image first so we can identify the dish.";
  }

  if (!file.type.startsWith("image/")) {
    return "Upload a valid image file.";
  }

  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    return "Upload an image smaller than 5 MB.";
  }

  return null;
}

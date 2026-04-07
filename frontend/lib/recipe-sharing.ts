export function buildRecipeUrl(recipeId: string, siteUrl?: string) {
  const baseUrl =
    siteUrl?.trim() ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

  return new URL(`/recipe/${recipeId}`, baseUrl).toString();
}

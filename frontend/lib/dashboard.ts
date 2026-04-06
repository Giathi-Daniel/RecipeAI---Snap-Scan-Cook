export type DashboardIngredient = {
  quantity: string;
  unit: string | null;
  item: string;
};

export type DashboardRecipe = {
  savedRecipeId: string;
  recipeId: string;
  title: string;
  description: string;
  imageUrl: string | null;
  servings: number | null;
  tags: string[];
  dietaryFlags: string[];
  ingredients: DashboardIngredient[];
  savedAt: string | null;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function filterDashboardRecipes(recipes: DashboardRecipe[], query: string) {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return recipes;
  }

  return recipes.filter((recipe) => {
    const haystacks = [
      recipe.title,
      recipe.description,
      ...recipe.tags,
      ...recipe.dietaryFlags,
      ...recipe.ingredients.map((ingredient) => ingredient.item),
    ];

    return haystacks.some((value) => normalize(value).includes(normalizedQuery));
  });
}

export function collectDashboardFilters(recipes: DashboardRecipe[]) {
  const values = new Set<string>();

  recipes.forEach((recipe) => {
    recipe.tags.forEach((tag) => values.add(tag));
    recipe.dietaryFlags.forEach((flag) => values.add(flag));
  });

  return Array.from(values).sort((left, right) => left.localeCompare(right));
}

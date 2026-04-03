import { RecipeDetailClient } from "@/components/recipe-detail-client";

const ingredients = [
  { quantity: "1", unit: "whole", item: "chicken, cut into pieces" },
  { quantity: "2", unit: null, item: "onions, sliced" },
  { quantity: "3", unit: null, item: "tomatoes, chopped" },
  { quantity: "1", unit: "cup", item: "coconut milk" },
  { quantity: "2", unit: "tsp", item: "smoked paprika" },
  { quantity: "1/2", unit: "cup", item: "stock" },
  { quantity: "a pinch", unit: null, item: "salt" },
];

export default function RecipeDetailPage() {
  return (
    <RecipeDetailClient
      title="Braised Coconut Chicken"
      description="A warm, weeknight-friendly braise with enough structure to prove live serving scaling across whole numbers, fractions, and descriptive quantities."
      ingredients={ingredients}
      servings={4}
    />
  );
}

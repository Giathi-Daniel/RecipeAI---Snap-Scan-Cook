import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DashboardClient } from "@/components/dashboard-client";
import type { DashboardRecipe } from "@/lib/dashboard";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const revalidate = 300; // Revalidate every 5 minutes
export const metadata: Metadata = {
  title: "Dashboard",
  description: "Browse, filter, and manage your saved RecipeAI recipes from one secure dashboard.",
  alternates: {
    canonical: "/dashboard",
  },
};

type SavedRecipeRow = {
  id: string;
  created_at: string | null;
  recipe_id: string;
  rating: number | null;
  notes: string | null;
  recipe: Array<{
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
    servings: number | null;
    structured_data: {
      ingredients?: Array<{
        quantity: string;
        unit: string | null;
        item: string;
      }>;
      tags?: string[];
    } | null;
    nutrition: {
      dietary_flags?: string[];
    } | null;
  }> | null;
};

function mapSavedRecipe(row: SavedRecipeRow): DashboardRecipe | null {
  const recipe = row.recipe?.[0];

  if (!recipe) {
    return null;
  }

  return {
    savedRecipeId: row.id,
    recipeId: recipe.id,
    title: recipe.title,
    description: recipe.description ?? "No description saved for this recipe yet.",
    imageUrl: recipe.image_url,
    servings: recipe.servings,
    tags: recipe.structured_data?.tags ?? [],
    dietaryFlags: recipe.nutrition?.dietary_flags ?? [],
    ingredients: recipe.structured_data?.ingredients ?? [],
    savedAt: row.created_at,
    rating: row.rating,
    notes: row.notes,
  };
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    redirect("/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("saved_recipes")
    .select(
      "id, created_at, recipe_id, rating, notes, recipe:recipes(id, title, description, image_url, servings, structured_data, nutrition)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load saved recipes: ${error.message}`);
  }

  const recipes = ((data ?? []) as SavedRecipeRow[])
    .map(mapSavedRecipe)
    .filter((recipe): recipe is DashboardRecipe => recipe !== null);

  return <DashboardClient userEmail={user.email ?? "Unknown user"} initialRecipes={recipes} />;
}

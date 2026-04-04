import { redirect } from "next/navigation";

import { RecipeDetailClient } from "@/components/recipe-detail-client";
import { getBackendUrl } from "@/lib/api";
import { createServerSupabaseClient } from "@/lib/supabase-server";

type RecipePageProps = {
  params: Promise<{
    id: string;
  }>;
};

type RecipeResponse = {
  recipe: {
    title: string;
    description: string | null;
    servings: number;
    nutrition: {
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
      dietary_flags: string[];
    } | null;
    structured_data: {
      ingredients: Array<{
        quantity: string;
        unit: string | null;
        item: string;
      }>;
      steps: Array<{
        order: number;
        instruction: string;
      }>;
      tags: string[];
    };
  };
};

export const dynamic = "force-dynamic";

export default async function RecipeDetailPage({ params }: RecipePageProps) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    redirect("/login");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    redirect("/login");
  }

  const response = await fetch(`${getBackendUrl()}/api/recipes/${id}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 401) {
      redirect("/login");
    }

    throw new Error(`Failed to load recipe ${id}.`);
  }

  const payload = (await response.json()) as RecipeResponse;
  const recipe = payload.recipe;

  return (
    <RecipeDetailClient
      title={recipe.title}
      description={recipe.description ?? "No description provided yet."}
      ingredients={recipe.structured_data.ingredients}
      steps={recipe.structured_data.steps}
      tags={recipe.structured_data.tags}
      servings={recipe.servings}
      nutrition={recipe.nutrition}
    />
  );
}

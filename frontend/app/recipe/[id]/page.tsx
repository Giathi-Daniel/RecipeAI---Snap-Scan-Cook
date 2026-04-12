import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { RecipeDetailClient } from "@/components/recipe-detail-client";
import { getBackendUrl } from "@/lib/api";
import { getSiteUrl } from "@/lib/site-url";
import { createServerSupabaseClient } from "@/lib/supabase-server";

type RecipePageProps = {
  params: Promise<{
    id: string;
  }>;
};

type RecipeResponse = {
  id?: string;
  user_id?: string | null;
  title: string;
  description: string | null;
  image_url: string | null;
  servings: number;
  is_public?: boolean;
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

type RecipeLookupResponse = {
  recipe: RecipeResponse;
};

export const dynamic = "force-dynamic";
export const revalidate = 3600; // Revalidate every hour for recipe pages

export async function generateMetadata({ params }: RecipePageProps): Promise<Metadata> {
  const { id } = await params;

  return {
    title: `Recipe ${id}`,
    description: "View a structured RecipeAI recipe with ingredients, steps, nutrition, and sharing.",
    alternates: {
      canonical: `/recipe/${id}`,
    },
  };
}

export default async function RecipeDetailPage({ params }: RecipePageProps) {
  const { id } = await params;
  const isDemoRecipe = id === "demo" || id === "demo-recipe";
  const siteUrl = getSiteUrl();

  if (isDemoRecipe) {
    const response = await fetch(`${getBackendUrl()}/api/recipes/demo`, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to load recipe ${id}.`);
    }

    const recipe = (await response.json()) as RecipeResponse;

    return (
      <RecipeDetailClient
        recipeId={id}
        title={recipe.title}
        description={recipe.description ?? "No description provided yet."}
        imageUrl={recipe.image_url}
        ingredients={recipe.structured_data.ingredients}
        steps={recipe.structured_data.steps}
        tags={recipe.structured_data.tags}
        servings={recipe.servings}
        nutrition={recipe.nutrition}
        canShare={false}
        isPublic
        siteUrl={siteUrl}
      />
    );
  }

  const publicResponse = await fetch(`${getBackendUrl()}/api/recipes/public/${id}`, {
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (publicResponse.ok) {
    const payload = (await publicResponse.json()) as RecipeLookupResponse;
    const recipe = payload.recipe;

    return (
      <RecipeDetailClient
        recipeId={recipe.id ?? id}
        title={recipe.title}
        description={recipe.description ?? "No description provided yet."}
        imageUrl={recipe.image_url}
        ingredients={recipe.structured_data.ingredients}
        steps={recipe.structured_data.steps}
        tags={recipe.structured_data.tags}
        servings={recipe.servings}
        nutrition={recipe.nutrition}
        canShare={false}
        isPublic={Boolean(recipe.is_public)}
        siteUrl={siteUrl}
      />
    );
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    redirect(`/login?next=/recipe/${id}`);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    redirect(`/login?next=/recipe/${id}`);
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
      redirect(`/login?next=/recipe/${id}`);
    }

    throw new Error(`Failed to load recipe ${id}.`);
  }

  const payload = (await response.json()) as RecipeLookupResponse;
  const recipe = payload.recipe;
  const canShare = Boolean(session.user.id && recipe.user_id && session.user.id === recipe.user_id);

  return (
    <RecipeDetailClient
      recipeId={recipe.id ?? id}
      title={recipe.title}
      description={recipe.description ?? "No description provided yet."}
      imageUrl={recipe.image_url}
      ingredients={recipe.structured_data.ingredients}
      steps={recipe.structured_data.steps}
      tags={recipe.structured_data.tags}
      servings={recipe.servings}
      nutrition={recipe.nutrition}
      canShare={canShare}
      isPublic={Boolean(recipe.is_public)}
      siteUrl={siteUrl}
    />
  );
}

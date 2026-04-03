"use client";

import { useState, useTransition } from "react";

import { IngredientList } from "@/components/ingredient-list";
import { NutritionBadge } from "@/components/nutrition-badge";
import { ServingScaler } from "@/components/serving-scaler";
import { apiPost } from "@/lib/api";

type Ingredient = {
  quantity: string;
  unit: string | null;
  item: string;
};

type RecipeDetailClientProps = {
  title: string;
  description: string;
  ingredients: Ingredient[];
  servings: number;
};

type ScaleRecipeResponse = {
  ingredients: Ingredient[];
  original_servings: number;
  target_servings: number;
};

export function RecipeDetailClient({
  title,
  description,
  ingredients,
  servings,
}: RecipeDetailClientProps) {
  const [displayedIngredients, setDisplayedIngredients] = useState(ingredients);
  const [displayedServings, setDisplayedServings] = useState(servings);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleServingChange(nextServings: number) {
    if (nextServings === displayedServings) {
      return;
    }

    startTransition(async () => {
      setError(null);

      try {
        const response = await apiPost<ScaleRecipeResponse>("/api/recipes/scale", {
          ingredients,
          original_servings: servings,
          target_servings: nextServings,
        });

        setDisplayedIngredients(response.ingredients);
        setDisplayedServings(response.target_servings);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Scaling ingredients failed for this recipe.",
        );
      }
    });
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="recipe-shell rounded-[2rem] border border-white/60 p-8 shadow-card">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accentDark">
              Interactive recipe view
            </p>
            <h1 className="mt-4 font-display text-5xl text-ink">{title}</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-ink/70">{description}</p>
          </div>
          <ServingScaler
            servings={displayedServings}
            isPending={isPending}
            onChange={handleServingChange}
          />
        </div>

        {error ? (
          <div className="mt-6 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="mt-6 rounded-[1.5rem] border border-sand/70 bg-canvas/70 px-5 py-4 text-sm text-ink/70">
          Ingredient quantities update live using the FastAPI scaling endpoint, while descriptive
          quantities like “a pinch” stay unchanged.
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="font-display text-3xl text-ink">Ingredients</h2>
            <div className="mt-5">
              <IngredientList ingredients={displayedIngredients} />
            </div>
          </div>
          <div>
            <h2 className="font-display text-3xl text-ink">Nutrition Snapshot</h2>
            <div className="mt-5 rounded-[1.5rem] border border-sand/80 bg-white/80 px-5">
              <NutritionBadge label="Calories" value="420 kcal" />
              <NutritionBadge label="Protein" value="34 g" />
              <NutritionBadge label="Carbs" value="12 g" />
              <NutritionBadge label="Fat" value="26 g" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { LogoutButton } from "@/components/logout-button";
import { RecipeCard } from "@/components/recipe-card";
import {
  collectDashboardFilters,
  filterDashboardRecipes,
  type DashboardRecipe,
} from "@/lib/dashboard";
import { createBrowserSupabaseClient } from "@/lib/supabase";

type DashboardClientProps = {
  userEmail: string;
  initialRecipes: DashboardRecipe[];
};

function formatSavedDate(savedAt: string | null) {
  if (!savedAt) {
    return "Saved recently";
  }

  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) {
    return "Saved recently";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function DashboardClient({ userEmail, initialRecipes }: DashboardClientProps) {
  const router = useRouter();
  const [recipes, setRecipes] = useState(initialRecipes);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const availableFilters = useMemo(() => collectDashboardFilters(recipes), [recipes]);
  const matchingRecipes = useMemo(() => {
    const searched = filterDashboardRecipes(recipes, query);

    if (!activeFilter) {
      return searched;
    }

    return searched.filter(
      (recipe) =>
        recipe.tags.includes(activeFilter) || recipe.dietaryFlags.includes(activeFilter),
    );
  }, [activeFilter, query, recipes]);

  async function handleDelete(savedRecipeId: string) {
    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      setDeleteError("Supabase is not configured in the frontend environment.");
      return;
    }

    startTransition(async () => {
      setDeleteError(null);
      setDeletingId(savedRecipeId);

      const { error } = await supabase.from("saved_recipes").delete().eq("id", savedRecipeId);

      if (error) {
        setDeleteError(error.message);
        setDeletingId(null);
        return;
      }

      setRecipes((current) => current.filter((recipe) => recipe.savedRecipeId !== savedRecipeId));
      setDeletingId(null);
      router.refresh();
    });
  }

  const hasRecipes = recipes.length > 0;

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="mt-3 font-display text-4xl text-ink">Your recipe dashboard</h1>
          <p className="mt-3 text-sm text-ink/70">
            Signed in as <span className="font-semibold text-ink">{userEmail}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="border border-sand bg-white px-4 py-2 text-sm text-ink/70">
            {recipes.length} saved {recipes.length === 1 ? "recipe" : "recipes"}
          </div>
          <LogoutButton />
        </div>
      </div>

      <div className="recipe-shell border border-sand p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="mt-2 font-display text-2xl text-ink">Find recipes by title, tag, or ingredient</h2>
          </div>
          <label className="flex w-full max-w-md flex-col gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink/45">
            Search saved recipes
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try pilau, coconut, vegetarian..."
              className="w-full rounded-full border border-sand/80 bg-canvas px-4 py-3 text-sm font-medium normal-case tracking-normal text-ink outline-none transition focus:border-accent/40"
            />
          </label>
        </div>

        {availableFilters.length ? (
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setActiveFilter(null)}
              className={`border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                activeFilter === null
                  ? "border border-ink bg-ink text-canvas"
                  : "border border-sand bg-white text-ink/70 hover:border-ink hover:text-ink"
              }`}
            >
              All recipes
            </button>
            {availableFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter((current) => (current === filter ? null : filter))}
                className={`border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                  activeFilter === filter
                    ? "border border-ink bg-ink text-canvas"
                    : "border border-sand bg-white text-ink/70 hover:border-ink hover:text-ink"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {deleteError ? (
        <div className="mt-6 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {deleteError}
        </div>
      ) : null}

      {!hasRecipes ? (
        <div className="recipe-shell mt-8 border border-sand px-8 py-12 text-center">
          <h2 className="mt-4 font-display text-4xl text-ink">
            You haven&apos;t saved any recipes yet.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-ink/70">
            Try uploading a food photo or pasting recipe text so RecipeAI can turn it into
            something worth keeping.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/upload"
              className="border border-ink bg-ink px-6 py-3 text-sm font-semibold text-canvas transition hover:bg-ink/90"
            >
              Upload a recipe
            </Link>
            <Link
              href="/recipe/demo"
              className="border border-sand bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:border-ink"
            >
              Explore the demo recipe
            </Link>
          </div>
        </div>
      ) : matchingRecipes.length ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {matchingRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.savedRecipeId}
              title={recipe.title}
              description={recipe.description}
              imageUrl={recipe.imageUrl}
              tags={[...recipe.dietaryFlags, ...recipe.tags]}
              servings={recipe.servings}
              ingredients={recipe.ingredients.slice(0, 4)}
              footer={
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-3 border border-sand bg-canvas px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink/55">
                    <span>{formatSavedDate(recipe.savedAt)}</span>
                    <span>{recipe.ingredients.length} ingredients</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/recipe/${recipe.recipeId}`}
                      className="inline-flex flex-1 items-center justify-center border border-ink bg-ink px-4 py-3 text-sm font-semibold text-canvas transition hover:bg-ink/90"
                    >
                      Open recipe
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(recipe.savedRecipeId)}
                      disabled={isPending && deletingId === recipe.savedRecipeId}
                      className="inline-flex items-center justify-center border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-wait disabled:opacity-60"
                    >
                      {isPending && deletingId === recipe.savedRecipeId ? "Removing..." : "Delete"}
                    </button>
                  </div>
                </div>
              }
            />
          ))}
        </div>
      ) : (
        <div className="recipe-shell mt-8 border border-sand px-8 py-10 text-center">
          <h2 className="mt-4 font-display text-3xl text-ink">Nothing matches your current filters.</h2>
          <p className="mt-4 text-sm leading-7 text-ink/70">
            Try a different title, ingredient, or tag search, or clear the active filter chips.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setActiveFilter(null);
            }}
            className="mt-6 border border-sand bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-ink"
          >
            Clear filters
          </button>
        </div>
      )}
    </section>
  );
}

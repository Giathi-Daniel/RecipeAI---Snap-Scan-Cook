"use client";

import Link from "next/link";
import { useMemo, useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";

import { CollectionModal } from "@/components/collection-modal";
import { LogoutButton } from "@/components/logout-button";
import { RecipeCard } from "@/components/recipe-card";
import { ShoppingListModal } from "@/components/shopping-list-modal";
import { StarRating } from "@/components/star-rating";
import { apiPost, apiPatch, apiDelete } from "@/lib/api";
import {
  collectDashboardFilters,
  filterDashboardRecipes,
  type DashboardRecipe,
} from "@/lib/dashboard";
import { createBrowserSupabaseClient } from "@/lib/supabase";

type Collection = {
  id: string;
  name: string;
  description: string | null;
  recipe_count: number;
};

type CollectionsResponse = {
  collections: Collection[];
  total: number;
};

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
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<Set<string>>(new Set());
  const [isShoppingListModalOpen, setIsShoppingListModalOpen] = useState(false);

  useEffect(() => {
    loadCollections();
  }, []);

  async function loadCollections() {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;

    setIsLoadingCollections(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;
      if (!accessToken) {
        setIsLoadingCollections(false);
        return;
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const response = await fetch(`${backendUrl}/api/collections/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = (await response.json()) as CollectionsResponse;
        setCollections(data.collections);
      } else {
        console.error("Collections API returned:", response.status, response.statusText);
      }
    } catch (err) {
      console.error("Failed to load collections:", err);
    } finally {
      setIsLoadingCollections(false);
    }
  }

  async function handleCreateCollection(name: string, description: string) {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const accessToken = session?.access_token;
    if (!accessToken) return;

    await apiPost(
      "/api/collections/",
      { name, description },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    await loadCollections();
  }

  async function handleUpdateCollection(name: string, description: string) {
    if (!editingCollection) return;

    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const accessToken = session?.access_token;
    if (!accessToken) return;

    await apiPatch(
      `/api/collections/${editingCollection.id}`,
      { name, description },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    await loadCollections();
    setEditingCollection(null);
  }

  async function handleDeleteCollection(collectionId: string) {
    if (!confirm("Delete this collection? Recipes will not be deleted.")) return;

    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const accessToken = session?.access_token;
    if (!accessToken) return;

    await apiDelete(`/api/collections/${collectionId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (selectedCollection === collectionId) {
      setSelectedCollection(null);
    }

    await loadCollections();
  }

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

  function toggleRecipeSelection(recipeId: string) {
    const newSelection = new Set(selectedRecipeIds);
    if (newSelection.has(recipeId)) {
      newSelection.delete(recipeId);
    } else {
      newSelection.add(recipeId);
    }
    setSelectedRecipeIds(newSelection);
  }

  function handleGenerateShoppingList() {
    if (selectedRecipeIds.size === 0) return;
    setIsShoppingListModalOpen(true);
  }

  const hasRecipes = recipes.length > 0;
  const selectedRecipes = recipes.filter((r) => selectedRecipeIds.has(r.recipeId));

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
          {selectedRecipeIds.size > 0 && (
            <button
              type="button"
              onClick={handleGenerateShoppingList}
              className="rounded-sm border border-herb bg-herb px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Generate Shopping List ({selectedRecipeIds.size})
            </button>
          )}
          <LogoutButton />
        </div>
      </div>

      <div className="mb-6 border border-sand bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-ink">Collections</h2>
          <button
            type="button"
            onClick={() => {
              setEditingCollection(null);
              setIsCollectionModalOpen(true);
            }}
            className="rounded-sm border border-ink bg-ink px-4 py-2 text-sm font-semibold text-canvas transition hover:bg-ink/90"
          >
            + New Collection
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedCollection(null)}
            className={`border px-4 py-2 text-sm font-semibold uppercase tracking-wider transition ${
              selectedCollection === null
                ? "border-ink bg-ink text-canvas"
                : "border-sand bg-white text-ink/70 hover:border-ink hover:text-ink"
            }`}
          >
            All Recipes ({recipes.length})
          </button>
          {collections.map((collection) => (
            <div key={collection.id} className="group relative">
              <button
                type="button"
                onClick={() =>
                  setSelectedCollection((current) =>
                    current === collection.id ? null : collection.id,
                  )
                }
                className={`border px-4 py-2 text-sm font-semibold uppercase tracking-wider transition ${
                  selectedCollection === collection.id
                    ? "border-ink bg-ink text-canvas"
                    : "border-sand bg-white text-ink/70 hover:border-ink hover:text-ink"
                }`}
              >
                {collection.name} ({collection.recipe_count})
              </button>
              <div className="absolute right-0 top-full z-10 mt-1 hidden border border-sand bg-white group-hover:block">
                <button
                  type="button"
                  onClick={() => {
                    setEditingCollection(collection);
                    setIsCollectionModalOpen(true);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-ink hover:bg-canvas"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteCollection(collection.id)}
                  className="block w-full px-4 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
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
              className="w-full border border-sand bg-canvas px-4 py-3 text-sm font-medium normal-case tracking-normal text-ink outline-none transition focus:border-accent"
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
        <div className="mt-6 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
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
          {matchingRecipes.map((recipe) => {
            const isSelected = selectedRecipeIds.has(recipe.recipeId);
            return (
              <div key={recipe.savedRecipeId} className="relative">
                <label className="absolute left-4 top-4 z-10 flex h-6 w-6 cursor-pointer items-center justify-center border-2 border-ink bg-white transition hover:bg-canvas">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleRecipeSelection(recipe.recipeId)}
                    className="h-4 w-4"
                  />
                </label>
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
                  {recipe.rating && (
                    <div className="flex items-center gap-2 border border-sand bg-white px-4 py-3">
                      <StarRating rating={recipe.rating} onRatingChange={() => {}} readonly size="sm" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-ink/55">
                        Your Rating
                      </span>
                    </div>
                  )}
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
          </div>
        );
      })}
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

      <CollectionModal
        isOpen={isCollectionModalOpen}
        onClose={() => {
          setIsCollectionModalOpen(false);
          setEditingCollection(null);
        }}
        onSave={editingCollection ? handleUpdateCollection : handleCreateCollection}
        editingCollection={editingCollection}
      />

      <ShoppingListModal
        isOpen={isShoppingListModalOpen}
        onClose={() => setIsShoppingListModalOpen(false)}
        selectedRecipes={selectedRecipes}
      />
    </section>
  );
}

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
  steps: Array<{
    order: number;
    instruction: string;
  }>;
  tags: string[];
  servings: number;
  nutrition: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    dietary_flags: string[];
  } | null;
};

type RecipePayload = {
  title: string;
  description: string;
  ingredients: Ingredient[];
  steps: Array<{
    order: number;
    instruction: string;
  }>;
  tags: string[];
  servings: number;
};

type ScaleRecipeResponse = {
  ingredients: Ingredient[];
  original_servings: number;
  target_servings: number;
};

type IngredientSubstitutionOption = {
  name: string;
  reason: string;
  notes: string | null;
};

type SubstituteResponse = {
  ingredient: Ingredient;
  substitutions: IngredientSubstitutionOption[];
};

type LocalizeRecipeResponse = {
  region: string;
  recipe: RecipePayload;
};

const LOCALIZATION_REGIONS = ["Kenya", "Nigeria", "India", "Mexico", "United Kingdom", "Brazil"];

export function RecipeDetailClient({
  title,
  description,
  ingredients,
  steps,
  tags,
  servings,
  nutrition,
}: RecipeDetailClientProps) {
  const baseRecipe = {
    title,
    description,
    ingredients,
    steps,
    tags,
    servings,
  };

  const [displayedRecipe, setDisplayedRecipe] = useState<RecipePayload>(baseRecipe);
  const [error, setError] = useState<string | null>(null);
  const [substitutionError, setSubstitutionError] = useState<string | null>(null);
  const [localizationError, setLocalizationError] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState(LOCALIZATION_REGIONS[0]);
  const [localizedRegion, setLocalizedRegion] = useState<string | null>(null);
  const [selectedIngredientIndex, setSelectedIngredientIndex] = useState<number | null>(null);
  const [substitutions, setSubstitutions] = useState<IngredientSubstitutionOption[]>([]);
  const [isScalingPending, startScalingTransition] = useTransition();
  const [isSubstitutionPending, startSubstitutionTransition] = useTransition();
  const [isLocalizationPending, startLocalizationTransition] = useTransition();

  function handleServingChange(nextServings: number) {
    if (nextServings === displayedRecipe.servings) {
      return;
    }

    startScalingTransition(async () => {
      setError(null);

      try {
        const response = await apiPost<ScaleRecipeResponse>("/api/recipes/scale", {
          ingredients: displayedRecipe.ingredients,
          original_servings: displayedRecipe.servings,
          target_servings: nextServings,
        });

        setDisplayedRecipe((current) => ({
          ...current,
          ingredients: response.ingredients,
          servings: response.target_servings,
        }));
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Scaling ingredients failed for this recipe.",
        );
      }
    });
  }

  function handleSubstitute(index: number) {
    const ingredient = displayedRecipe.ingredients[index];
    if (!ingredient) {
      return;
    }

    startSubstitutionTransition(async () => {
      setSubstitutionError(null);
      setSelectedIngredientIndex(index);
      setSubstitutions([]);

      try {
        const response = await apiPost<SubstituteResponse>("/api/recipes/substitute", {
          ingredient,
          recipe_title: displayedRecipe.title,
          recipe_description: displayedRecipe.description,
          tags: displayedRecipe.tags,
        });

        setSubstitutions(response.substitutions);
      } catch (requestError) {
        setSubstitutionError(
          requestError instanceof Error
            ? requestError.message
            : "We couldn't load substitutions for that ingredient.",
        );
      }
    });
  }

  function handleLocalizeRecipe() {
    startLocalizationTransition(async () => {
      setLocalizationError(null);

      try {
        const response = await apiPost<LocalizeRecipeResponse>("/api/recipes/localize", {
          region: selectedRegion,
          recipe: displayedRecipe,
        });

        setDisplayedRecipe(response.recipe);
        setLocalizedRegion(response.region);
        setSelectedIngredientIndex(null);
        setSubstitutions([]);
      } catch (requestError) {
        setLocalizationError(
          requestError instanceof Error
            ? requestError.message
            : "We couldn't localize this recipe right now.",
        );
      }
    });
  }

  const selectedIngredient =
    selectedIngredientIndex !== null ? displayedRecipe.ingredients[selectedIngredientIndex] : null;
  const displayedNutrition = localizedRegion ? null : nutrition;

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="recipe-shell rounded-[2rem] border border-white/60 p-8 shadow-card">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accentDark">
              Interactive recipe view
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <h1 className="font-display text-5xl text-ink">{displayedRecipe.title}</h1>
              {localizedRegion ? (
                <span className="rounded-full border border-herb/20 bg-herb/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-herb">
                  Localized for {localizedRegion}
                </span>
              ) : null}
            </div>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-ink/70">
              {displayedRecipe.description}
            </p>
          </div>
          <ServingScaler
            servings={displayedRecipe.servings}
            isPending={isScalingPending}
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

        <div className="mt-6 rounded-[1.75rem] border border-accent/15 bg-white/80 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accentDark">
                Localization
              </p>
              <h2 className="mt-2 font-display text-2xl text-ink">Adapt this recipe for another region</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/70">
                Swap pantry assumptions, ingredient availability, and flavor cues for a local
                version of the dish.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink/45">
                Region
                <select
                  value={selectedRegion}
                  onChange={(event) => setSelectedRegion(event.target.value)}
                  className="min-w-[14rem] rounded-full border border-sand/80 bg-canvas px-4 py-3 text-sm font-medium normal-case tracking-normal text-ink outline-none transition focus:border-accent/40"
                >
                  {LOCALIZATION_REGIONS.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={handleLocalizeRecipe}
                disabled={isLocalizationPending}
                className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accentDark transition hover:bg-accent/85 disabled:cursor-wait disabled:opacity-60"
              >
                {isLocalizationPending ? "Localizing..." : "Localize Recipe"}
              </button>
            </div>
          </div>

          {localizationError ? (
            <div className="mt-4 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {localizationError}
            </div>
          ) : null}
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="font-display text-3xl text-ink">Ingredients</h2>
            <div className="mt-5">
              <IngredientList
                ingredients={displayedRecipe.ingredients}
                onSubstitute={handleSubstitute}
                substituteBusyIndex={isSubstitutionPending ? selectedIngredientIndex : null}
              />
            </div>

            {selectedIngredient ? (
              <div className="mt-5 rounded-[1.5rem] border border-accent/20 bg-accent/5 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accentDark">
                      Ingredient substitutions
                    </p>
                    <h3 className="mt-2 font-display text-2xl text-ink">{selectedIngredient.item}</h3>
                    <p className="mt-2 text-sm leading-6 text-ink/70">
                      AI-picked alternatives that should still work in this dish.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedIngredientIndex(null);
                      setSubstitutions([]);
                      setSubstitutionError(null);
                    }}
                    className="rounded-full border border-sand/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink/60 transition hover:border-ink/20 hover:text-ink"
                  >
                    Close
                  </button>
                </div>

                {substitutionError ? (
                  <div className="mt-4 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {substitutionError}
                  </div>
                ) : null}

                {substitutions.length ? (
                  <div className="mt-4 grid gap-3">
                    {substitutions.map((option) => (
                      <article
                        key={`${selectedIngredient.item}-${option.name}`}
                        className="rounded-[1.25rem] border border-white/70 bg-white/80 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink">
                            {option.name}
                          </h4>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-ink/75">{option.reason}</p>
                        {option.notes ? (
                          <p className="mt-2 text-xs font-medium uppercase tracking-[0.12em] text-ink/50">
                            {option.notes}
                          </p>
                        ) : null}
                      </article>
                    ))}
                  </div>
                ) : isSubstitutionPending ? (
                  <div className="mt-4 rounded-[1.25rem] border border-sand/70 bg-white/80 px-4 py-3 text-sm text-ink/70">
                    Looking for 2 to 3 strong swaps for this ingredient...
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mt-8">
              <h2 className="font-display text-3xl text-ink">Method</h2>
              <ol className="mt-5 space-y-4 rounded-[1.5rem] border border-sand/80 bg-white/85 p-5">
                {displayedRecipe.steps.map((step) => (
                  <li key={`${step.order}-${step.instruction}`} className="flex gap-3">
                    <span className="w-6 shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-ink/35">
                      {String(step.order).padStart(2, "0")}
                    </span>
                    <p className="text-sm leading-6 text-ink/80">{step.instruction}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <div>
            <h2 className="font-display text-3xl text-ink">Nutrition Snapshot</h2>
            {displayedNutrition ? (
              <div className="mt-5 rounded-[1.5rem] border border-sand/80 bg-white/80 p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <NutritionBadge label="Calories" value={`${displayedNutrition.calories} kcal`} />
                  <NutritionBadge label="Protein" value={`${displayedNutrition.protein_g} g`} />
                  <NutritionBadge label="Carbs" value={`${displayedNutrition.carbs_g} g`} />
                  <NutritionBadge label="Fat" value={`${displayedNutrition.fat_g} g`} />
                </div>

                {displayedNutrition.dietary_flags.length ? (
                  <div className="mt-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">
                      Dietary flags
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {displayedNutrition.dietary_flags.map((flag) => (
                        <span
                          key={flag}
                          className="rounded-full border border-herb/20 bg-herb/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-herb"
                        >
                          {flag}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {displayedRecipe.tags.length ? (
                  <div className="mt-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">
                      Recipe tags
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {displayedRecipe.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-accent/20 bg-accent/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-accentDark"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-5 rounded-[1.5rem] border border-sand/80 bg-white/80 px-5 py-5 text-sm leading-6 text-ink/70">
                {localizedRegion
                  ? "Nutrition analysis has not been recalculated for this localized version yet."
                  : "Nutrition analysis is not available for this recipe yet."}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

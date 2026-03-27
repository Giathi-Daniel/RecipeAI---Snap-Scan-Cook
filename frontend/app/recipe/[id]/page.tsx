import { IngredientList } from "@/components/ingredient-list";
import { NutritionBadge } from "@/components/nutrition-badge";
import { ServingScaler } from "@/components/serving-scaler";

const ingredients = [
  "1 whole chicken, cut into pieces",
  "2 onions, sliced",
  "3 tomatoes, chopped",
  "1 cup coconut milk",
  "2 tsp smoked paprika",
];

export default function RecipeDetailPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="recipe-shell rounded-[2rem] border border-white/60 p-8 shadow-card">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accentDark">
              Recipe page scaffold
            </p>
            <h1 className="mt-4 font-display text-5xl text-ink">Braised Coconut Chicken</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-ink/70">
              The single recipe experience is ready for serving scaling, nutrition, ingredient
              substitutions, localization, and public sharing.
            </p>
          </div>
          <ServingScaler servings={4} />
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="font-display text-3xl text-ink">Ingredients</h2>
            <div className="mt-5">
              <IngredientList ingredients={ingredients} />
            </div>
          </div>
          <div>
            <h2 className="font-display text-3xl text-ink">Nutrition Snapshot</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
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

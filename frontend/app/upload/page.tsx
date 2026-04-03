"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { RecipeCard } from "@/components/recipe-card";
import { apiPost, apiPostFormData } from "@/lib/api";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { validateImageUpload, validateRecipeText } from "@/lib/upload-validation";
import { cn } from "@/utils/cn";

type ParsedRecipe = {
  title: string;
  description: string | null;
  ingredients: Array<{
    quantity: string;
    unit: string | null;
    item: string;
  }>;
  steps: Array<{
    order: number;
    instruction: string;
  }>;
  servings: number;
  tags: string[];
};

type ParseRecipeResponse = {
  recipe: ParsedRecipe;
  raw_response: ParsedRecipe;
};

type SaveRecipeResponse = {
  recipe: {
    id: string;
  };
};

type VisionIdentifyResponse = {
  dish_name: string;
  labels: string[];
  recipe: ParsedRecipe;
  raw_response: ParsedRecipe;
};

const starterPrompt = `Meatball Pizza Buns Recipe

Ingredients
- 500 g all-purpose flour
- 7 g instant yeast
- 300 ml warm water
- 400 g minced beef

Method
1. Mix the dough ingredients and knead until smooth.
2. Shape the meatballs and cook until browned.
3. Assemble the buns, top with sauce and cheese, then bake.`;

const workspaceNotes = [
  "Handles long pasted recipes without collapsing the layout.",
  "Keeps input and parsed output readable side by side on desktop.",
  "Stacks naturally on mobile with touch-friendly spacing.",
] as const;

export default function UploadPage() {
  const router = useRouter();
  const [recipeText, setRecipeText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [visionLabels, setVisionLabels] = useState<string[]>([]);
  const [dishName, setDishName] = useState<string | null>(null);
  const [recipeSourceText, setRecipeSourceText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [parsedRecipe, setParsedRecipe] = useState<ParsedRecipe | null>(null);

  useEffect(() => {
    if (!selectedImage) {
      setImagePreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedImage);
    setImagePreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedImage]);

  async function handleParseRecipe() {
    const trimmedText = recipeText.trim();
    const validationMessage = validateRecipeText(trimmedText);

    if (validationMessage) {
      setError(validationMessage);
      setSaveMessage(null);
      return;
    }

    setIsParsing(true);
    setError(null);
    setSaveMessage(null);

    try {
      const response = await apiPost<ParseRecipeResponse>("/api/recipes/parse", {
        text: trimmedText,
      });
      setParsedRecipe(response.recipe);
      setRecipeSourceText(trimmedText);
      setVisionLabels([]);
      setDishName(null);
    } catch (err) {
      setParsedRecipe(null);
      setError(err instanceof Error ? err.message : "Recipe parsing failed.");
    } finally {
      setIsParsing(false);
    }
  }

  async function handleSaveRecipe() {
    if (!parsedRecipe) {
      setError("Parse a recipe before saving it.");
      setSaveMessage(null);
      return;
    }

    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      setError("Supabase is not configured in the frontend environment.");
      setSaveMessage(null);
      return;
    }

    setIsSaving(true);
    setError(null);
    setSaveMessage(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;

      if (!accessToken) {
        router.push("/login");
        throw new Error("Sign in to save recipes to your dashboard.");
      }

      await apiPost<SaveRecipeResponse>(
        "/api/recipes/save",
        {
          title: parsedRecipe.title,
          description: parsedRecipe.description,
          source_text: recipeSourceText,
          ingredients: parsedRecipe.ingredients,
          steps: parsedRecipe.steps,
          servings: parsedRecipe.servings,
          tags: parsedRecipe.tags,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      setSaveMessage("Recipe saved to your dashboard.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saving this recipe failed.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleIdentifyDish() {
    const validationMessage = validateImageUpload(selectedImage);

    if (validationMessage) {
      setError(validationMessage);
      setSaveMessage(null);
      return;
    }

    const imageFile = selectedImage;
    if (!imageFile) {
      return;
    }

    setIsIdentifying(true);
    setError(null);
    setSaveMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", imageFile);

      const response = await apiPostFormData<VisionIdentifyResponse>(
        "/api/vision/identify",
        formData,
      );

      setParsedRecipe(response.recipe);
      setVisionLabels(response.labels);
      setDishName(response.dish_name);
      setRecipeSourceText(
        `Generated from uploaded image.\nDish: ${response.dish_name}\nVision labels: ${response.labels.join(", ")}`,
      );
    } catch (err) {
      setParsedRecipe(null);
      setVisionLabels([]);
      setDishName(null);
      setError(err instanceof Error ? err.message : "Dish identification failed.");
    } finally {
      setIsIdentifying(false);
    }
  }

  const isBusy = isParsing || isIdentifying || isSaving;

  return (
    <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 shadow-card">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.3fr)_minmax(20rem,0.7fr)]">
          <div className="bg-[radial-gradient(circle_at_top_left,rgba(217,98,38,0.16),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.95),rgba(255,255,255,0.84))] px-5 py-7 sm:px-7 sm:py-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accentDark">
              Professional parser workspace
            </p>
            <div className="mt-6 max-w-3xl">
              <h1 className="font-display text-3xl leading-tight text-ink sm:text-4xl lg:text-[3.2rem]">
                Parse long recipes in a calmer, cleaner workspace.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/75 sm:text-base">
                Built for real recipe text, not tiny demos. Paste something long, keep your place,
                and compare the raw source with the structured result without the page turning into
                a wall of scrolling.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="border-l-2 border-accent pl-4 text-sm font-semibold text-ink/75">
                Long-form input ready
              </div>
              <div className="border-l-2 border-herb pl-4 text-sm font-semibold text-ink/75">
                Split preview workspace
              </div>
              <div className="border-l-2 border-sand pl-4 text-sm font-semibold text-ink/75">
                Mobile-first navigation
              </div>
            </div>
          </div>

          <aside className="border-t border-sand/70 bg-[linear-gradient(180deg,rgba(246,241,232,0.76),rgba(255,255,255,0.94))] px-5 py-6 sm:px-7 lg:border-l lg:border-t-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink/45">
              Workspace notes
            </p>
            <div className="mt-5 grid gap-4">
              {workspaceNotes.map((note, index) => (
                <WorkspaceNote key={note} index={index + 1} note={note} />
              ))}
            </div>
            <div className="mt-6 rounded-[1.5rem] border border-white/80 bg-white/80 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">
                Best on desktop
              </p>
              <p className="mt-2 text-sm leading-6 text-ink/70">
                Use the sticky left editor and the independently scrolling preview on the right to
                review large recipes faster.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-start">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 shadow-card lg:sticky lg:top-28">
          <div className="border-b border-sand/80 bg-[linear-gradient(135deg,rgba(217,98,38,0.12),rgba(95,124,66,0.08))] px-8 py-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accentDark">
              Input
            </p>
            <h1 className="mt-4 max-w-xl font-display text-4xl leading-tight text-ink">
              Turn recipe text or food photos into clean, structured cooking data.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink/75">
              Paste notes from WhatsApp, TikTok captions, food blogs, or your own drafts, or
              upload a dish photo and let Vision plus Gemini turn it into a usable recipe.
            </p>
          </div>

          <div className="p-5 sm:p-8 lg:max-h-[calc(100vh-13rem)] lg:overflow-y-auto">
            <div className="mb-5 flex flex-wrap gap-3">
              <div className="border-l-2 border-accent pl-4 text-sm text-ink/75">
                JSON schema enforced
              </div>
              <div className="border-l-2 border-herb pl-4 text-sm text-ink/75">
                Ingredients and steps extracted
              </div>
              <div className="border-l-2 border-sand pl-4 text-sm text-ink/75">
                Photo-to-recipe generation
              </div>
            </div>

            <section className="rounded-[1.5rem] border border-sand/80 bg-canvas/75 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-herb">
                    Photo upload
                  </p>
                  <p className="mt-2 text-sm leading-6 text-ink/70">
                    Upload a food photo to identify the dish and generate a structured recipe.
                  </p>
                </div>
                {dishName ? (
                  <div className="rounded-full border border-herb/20 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-herb">
                    {dishName}
                  </div>
                ) : null}
              </div>

              <label
                htmlFor="recipe-image"
                className="mt-5 block text-sm font-semibold uppercase tracking-[0.2em] text-ink/55"
              >
                Dish photo
              </label>
              <input
                id="recipe-image"
                type="file"
                accept="image/*"
                onChange={(event) => setSelectedImage(event.target.files?.[0] ?? null)}
                disabled={isBusy}
                className="mt-3 block w-full rounded-[1rem] border border-sand bg-white px-4 py-3 text-sm text-ink file:mr-4 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
              />

              {imagePreviewUrl ? (
                <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-sand/80 bg-white">
                  <img
                    src={imagePreviewUrl}
                    alt="Selected dish preview"
                    className="h-56 w-full object-cover"
                  />
                </div>
              ) : (
                <div className="mt-4 rounded-[1.5rem] border border-dashed border-sand bg-white/70 px-4 py-8 text-center text-sm text-ink/55">
                  Your selected image preview appears here before submission.
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleIdentifyDish}
                  disabled={isBusy || !selectedImage}
                  className="rounded-full bg-herb px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="flex items-center gap-2">
                    {isIdentifying ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    ) : null}
                    <span>{isIdentifying ? "Identifying dish..." : "Generate From Photo"}</span>
                  </span>
                </button>
                {visionLabels.length ? (
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">
                    Labels: {visionLabels.join(" • ")}
                  </span>
                ) : null}
              </div>
            </section>

            <label
              htmlFor="recipe-text"
              className="mt-6 block text-sm font-semibold uppercase tracking-[0.2em] text-ink/55"
            >
              Recipe source text
            </label>
            <textarea
              id="recipe-text"
              value={recipeText}
              onChange={(event) => setRecipeText(event.target.value)}
              placeholder="Paste recipe text here..."
              className="mt-3 min-h-[20rem] w-full rounded-[1.5rem] border border-sand bg-white px-5 py-5 text-sm leading-7 text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 lg:min-h-[28rem]"
            />

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleParseRecipe}
                disabled={isBusy}
                className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex items-center gap-2">
                  {isParsing ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : null}
                  <span>{isParsing ? "Parsing recipe..." : "Parse Recipe"}</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRecipeText(starterPrompt)}
                disabled={isBusy}
                className="rounded-full border border-ink/10 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                Load Example
              </button>
              <button
                type="button"
                onClick={() => {
                      setRecipeText("");
                      setParsedRecipe(null);
                      setSelectedImage(null);
                      setVisionLabels([]);
                      setDishName(null);
                      setRecipeSourceText("");
                      setError(null);
                      setSaveMessage(null);
                    }}
                disabled={isBusy}
                className="rounded-full border border-ink/10 px-5 py-3 text-sm font-semibold text-ink/75 transition hover:border-ink/25 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
              >
                Clear
              </button>
            </div>

            {error ? (
              <div className="mt-4 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            {saveMessage ? (
              <div className="mt-4 rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {saveMessage}
              </div>
            ) : null}
          </div>
        </div>

        <article className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 shadow-card">
          <div className="border-b border-sand/80 px-6 py-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-herb">
              Structured preview
            </p>
            <h2 className="mt-2 font-display text-3xl text-ink">
              {parsedRecipe ? parsedRecipe.title : "Recipe output appears here"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-ink/70">
              {parsedRecipe?.description ??
                "Once parsing succeeds, this panel will show the cleaned recipe title, ingredients, steps, servings, and tags."}
            </p>
          </div>

          <div className="p-5 sm:p-6 lg:max-h-[calc(100vh-13rem)] lg:overflow-y-auto">
            {parsedRecipe ? (
              <div className="grid gap-6">
                {visionLabels.length ? (
                  <section className="rounded-[1.5rem] border border-sand/80 bg-white/80 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink/55">
                      Vision reading
                    </p>
                    <h3 className="mt-3 font-display text-2xl text-ink">
                      {dishName ?? "Dish identified from photo"}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-ink/70">
                      Google Cloud Vision extracted these cues before Gemini generated the recipe.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {visionLabels.map((label) => (
                        <span
                          key={label}
                          className="rounded-full border border-sand bg-canvas px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink/65"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </section>
                ) : null}

                <RecipeCard
                  title={parsedRecipe.title}
                  description={
                    parsedRecipe.description ??
                    "Parsed successfully. Review the structured ingredients and steps, then save it when it looks right."
                  }
                  servings={parsedRecipe.servings}
                  tags={parsedRecipe.tags}
                  ingredients={parsedRecipe.ingredients}
                  steps={parsedRecipe.steps}
                  footer={
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleSaveRecipe}
                        disabled={isBusy}
                        className="rounded-full bg-herb px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSaving ? "Saving recipe..." : "Save Recipe"}
                      </button>
                      <Link
                        href="/dashboard"
                        className="rounded-full border border-ink/10 px-5 py-3 text-sm font-semibold text-ink/80 transition hover:border-accent hover:text-accent"
                      >
                        View Dashboard
                      </Link>
                    </div>
                  }
                />

                <section className="rounded-[1.5rem] border border-dashed border-sand bg-white/60 p-5">
                  <h3 className="font-display text-xl text-ink">Raw quality check</h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <StatCard
                      label="Ingredients"
                      value={String(parsedRecipe.ingredients.length)}
                    />
                    <StatCard label="Steps" value={String(parsedRecipe.steps.length)} />
                    <StatCard label="Tags" value={String(parsedRecipe.tags.length)} />
                  </div>
                </section>
              </div>
            ) : (
              <div className="grid gap-4">
                {["Title normalization", "Ingredient extraction", "Step ordering"].map(
                  (item, index) => (
                    <div
                      key={item}
                      className={cn(
                        "rounded-[1.5rem] border border-sand/80 p-5",
                        index === 1 ? "bg-canvas/80" : "bg-white/80",
                      )}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">
                        Preview block {index + 1}
                      </p>
                      <h3 className="mt-2 font-display text-2xl text-ink">{item}</h3>
                      <p className="mt-3 text-sm leading-6 text-ink/70">
                        This area is ready to display structured parser output as soon as the
                        backend returns JSON.
                      </p>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-sand/80 bg-canvas px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">{label}</p>
      <p className="mt-2 font-display text-3xl text-ink">{value}</p>
    </div>
  );
}

function WorkspaceNote({ index, note }: { index: number; note: string }) {
  return (
    <div className="flex gap-4 rounded-[1.5rem] border border-sand/80 bg-white/72 px-4 py-4">
      <div className="w-7 shrink-0 pt-1 text-xs font-semibold uppercase tracking-[0.18em] text-ink/35">
        {String(index).padStart(2, "0")}
      </div>
      <p className="pt-1 text-sm leading-6 text-ink/75">{note}</p>
    </div>
  );
}

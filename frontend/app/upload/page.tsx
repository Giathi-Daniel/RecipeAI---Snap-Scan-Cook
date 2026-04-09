"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { CollectionModal } from "@/components/collection-modal";
import { CollectionSelector } from "@/components/collection-selector";
import { RecipeCard } from "@/components/recipe-card";
import { apiPost, apiPostFormData } from "@/lib/api";
import { authFetch } from "@/lib/auth-fetch";
import { sanitizeMultilineText } from "@/lib/security";
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

type ImportUrlResponse = {
  recipe: ParsedRecipe;
  source_url: string;
  extraction_method: string;
};

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

export default function UploadPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"text" | "image" | "url" | "generate">("text");
  const [recipeText, setRecipeText] = useState("");
  const [recipeUrl, setRecipeUrl] = useState("");
  const [dishName, setDishName] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [visionLabels, setVisionLabels] = useState<string[]>([]);
  const [identifiedDishName, setIdentifiedDishName] = useState<string | null>(null);
  const [extractionMethod, setExtractionMethod] = useState<string | null>(null);
  const [recipeSourceText, setRecipeSourceText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [parsedRecipe, setParsedRecipe] = useState<ParsedRecipe | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);

  useEffect(() => {
    if (!selectedImage) {
      setImagePreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedImage);
    setImagePreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedImage]);

  useEffect(() => {
    loadCollections();
  }, []);

  async function loadCollections() {
    setIsLoadingCollections(true);
    try {
      const data = await authFetch<CollectionsResponse>("/api/collections/");
      setCollections(data.collections);
    } catch (err) {
      console.error("Failed to load collections:", err);
    } finally {
      setIsLoadingCollections(false);
    }
  }

  async function handleCreateCollection(name: string, description: string) {
    try {
      await authFetch("/api/collections/", {
        method: "POST",
        body: { name, description },
      });
      await loadCollections();
    } catch (err) {
      console.error("Failed to create collection:", err);
      setError(err instanceof Error ? err.message : "Failed to create collection");
    }
  }

  async function handleImportFromUrl() {
    const trimmedUrl = recipeUrl.trim();

    if (!trimmedUrl) {
      setError("Please enter a recipe URL.");
      setSaveMessage(null);
      return;
    }

    if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
      setError("URL must start with http:// or https://");
      setSaveMessage(null);
      return;
    }

    setIsImporting(true);
    setError(null);
    setSaveMessage(null);

    try {
      const response = await apiPost<ImportUrlResponse>("/api/recipes/import-url", {
        url: trimmedUrl,
      });
      setParsedRecipe(response.recipe);
      setRecipeSourceText(`Imported from: ${response.source_url}`);
      setExtractionMethod(response.extraction_method);
      setVisionLabels([]);
      setIdentifiedDishName(null);
    } catch (err) {
      setParsedRecipe(null);
      setError(err instanceof Error ? err.message : "URL import failed.");
    } finally {
      setIsImporting(false);
    }
  }

  async function handleParseRecipe() {
    const trimmedText = sanitizeMultilineText(recipeText);
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
      setIdentifiedDishName(null);
      setExtractionMethod(null);
    } catch (err) {
      setParsedRecipe(null);
      setError(err instanceof Error ? err.message : "Recipe parsing failed.");
    } finally {
      setIsParsing(false);
    }
  }

  async function handleGenerateRecipe() {
    const trimmedName = dishName.trim();

    if (!trimmedName) {
      setError("Please enter a dish name.");
      setSaveMessage(null);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSaveMessage(null);

    try {
      const response = await apiPost<ParseRecipeResponse>("/api/recipes/generate", {
        text: trimmedName,
      });
      setParsedRecipe(response.recipe);
      setRecipeSourceText(`Generated from dish name: ${trimmedName}`);
      setVisionLabels([]);
      setIdentifiedDishName(null);
      setExtractionMethod(null);
    } catch (err) {
      setParsedRecipe(null);
      setError(err instanceof Error ? err.message : "Recipe generation failed.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSaveRecipe() {
    if (!parsedRecipe) {
      setError("Parse a recipe before saving it.");
      setSaveMessage(null);
      return;
    }

    setIsSaving(true);
    setError(null);
    setSaveMessage(null);

    try {
      const response = await authFetch<SaveRecipeResponse>("/api/recipes/save", {
        method: "POST",
        body: {
          title: parsedRecipe.title,
          description: parsedRecipe.description,
          source_text: recipeSourceText,
          ingredients: parsedRecipe.ingredients,
          steps: parsedRecipe.steps,
          servings: parsedRecipe.servings,
          tags: parsedRecipe.tags,
          collection_ids: selectedCollectionIds,
        },
      });

      setSaveMessage("Recipe saved. Opening the full recipe view.");
      router.push(`/recipe/${response.recipe.id}`);
    } catch (err) {
      if (err instanceof Error && err.message.includes("Authentication required")) {
        router.push("/login");
      }
      setError(err instanceof Error ? err.message : "Saving this recipe failed.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleIdentifyDish() {
    const validationMessage = validateImageUpload(
      selectedImage
        ? { size: selectedImage.size, type: selectedImage.type, name: selectedImage.name }
        : null,
    );

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
      setIdentifiedDishName(response.dish_name);
      setExtractionMethod(null);
      setRecipeSourceText(
        `Generated from uploaded image.\nDish: ${response.dish_name}\nVision labels: ${response.labels.join(", ")}`,
      );
    } catch (err) {
      setParsedRecipe(null);
      setVisionLabels([]);
      setIdentifiedDishName(null);
      setError(err instanceof Error ? err.message : "Dish identification failed.");
    } finally {
      setIsIdentifying(false);
    }
  }

  function handleClear() {
    setRecipeText("");
    setRecipeUrl("");
    setDishName("");
    setParsedRecipe(null);
    setSelectedImage(null);
    setVisionLabels([]);
    setIdentifiedDishName(null);
    setExtractionMethod(null);
    setRecipeSourceText("");
    setError(null);
    setSaveMessage(null);
  }

  const isBusy = isParsing || isIdentifying || isSaving || isImporting || isGenerating;

  return (
    <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-start">
        <div className="overflow-hidden border border-sand bg-white lg:sticky lg:top-28">
          <div className="border-b border-sand px-4 py-6 sm:px-8 sm:py-8">
            <div className="mb-6 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <div className="flex gap-2 border-b border-sand min-w-max">
                <button
                  type="button"
                  onClick={() => setActiveTab("text")}
                  className={cn(
                    "border-b-2 px-3 py-3 text-xs sm:text-sm font-semibold uppercase tracking-wider transition whitespace-nowrap",
                    activeTab === "text"
                      ? "border-ink text-ink"
                      : "border-transparent text-ink/50 hover:text-ink/75",
                  )}
                >
                  Text
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("image")}
                  className={cn(
                    "border-b-2 px-3 py-3 text-xs sm:text-sm font-semibold uppercase tracking-wider transition whitespace-nowrap",
                    activeTab === "image"
                      ? "border-ink text-ink"
                      : "border-transparent text-ink/50 hover:text-ink/75",
                  )}
                >
                  Image
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("url")}
                  className={cn(
                    "border-b-2 px-3 py-3 text-xs sm:text-sm font-semibold uppercase tracking-wider transition whitespace-nowrap",
                    activeTab === "url"
                      ? "border-ink text-ink"
                      : "border-transparent text-ink/50 hover:text-ink/75",
                  )}
                >
                  URL
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("generate")}
                  className={cn(
                    "border-b-2 px-3 py-3 text-xs sm:text-sm font-semibold uppercase tracking-wider transition whitespace-nowrap",
                    activeTab === "generate"
                      ? "border-ink text-ink"
                      : "border-transparent text-ink/50 hover:text-ink/75",
                  )}
                >
                  Generate
                </button>
              </div>
            </div>
            <h1 className="mt-4 max-w-xl font-display text-2xl sm:text-3xl lg:text-4xl leading-tight text-ink">
              Turn recipes into clean, structured cooking data.
            </h1>
            <p className="mt-4 max-w-2xl text-sm sm:text-base leading-6 sm:leading-7 text-ink/75">
              Paste recipe text, upload a dish photo, import from a URL, or generate from a dish name. AI structures it automatically.
            </p>
          </div>

          <div className="p-5 sm:p-8 lg:max-h-[calc(100vh-13rem)] lg:overflow-y-auto">
            {activeTab === "generate" && (
              <section className="border border-sand bg-canvas p-5">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-herb">
                    Generate from dish name
                  </p>
                  <p className="mt-2 text-sm leading-6 text-ink/70">
                    Type any dish name from any cuisine, and AI will generate a complete authentic recipe.
                  </p>
                </div>

                <label
                  htmlFor="dish-name"
                  className="mt-5 block text-sm font-semibold uppercase tracking-[0.2em] text-ink/55"
                >
                  Dish name
                </label>
                <input
                  id="dish-name"
                  type="text"
                  value={dishName}
                  onChange={(event) => setDishName(event.target.value)}
                  placeholder="e.g., githeri, pizza, biryani, pad thai..."
                  disabled={isBusy}
                  className="mt-3 block w-full border border-sand bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-accent"
                />

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleGenerateRecipe}
                    disabled={isBusy || !dishName.trim()}
                    className="rounded-sm border border-ink bg-ink px-6 py-3 text-sm font-semibold text-canvas transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="flex items-center gap-2">
                      {isGenerating ? (
                        <span className="h-4 w-4 animate-spin border-2 border-white/40 border-t-white" />
                      ) : null}
                      <span>{isGenerating ? "Generating recipe..." : "Generate Recipe"}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={isBusy}
                    className="border border-sand bg-white px-5 py-3 text-sm font-semibold text-ink/75 transition hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Clear
                  </button>
                </div>

                <div className="mt-5 border border-sand bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/55">
                    Examples
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["Githeri", "Ugali", "Pilau", "Chapati", "Nyama Choma"].map((example) => (
                      <button
                        key={example}
                        type="button"
                        onClick={() => setDishName(example)}
                        disabled={isBusy}
                        className="border border-sand bg-canvas px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink transition hover:border-ink disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {activeTab === "url" && (
              <section className="border border-sand bg-canvas p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-herb">
                      URL import
                    </p>
                    <p className="mt-2 text-sm leading-6 text-ink/70">
                      Import recipes from popular cooking websites automatically.
                    </p>
                  </div>
                  {extractionMethod ? (
                    <div className="border border-sand bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-ink">
                      {extractionMethod}
                    </div>
                  ) : null}
                </div>

                <label
                  htmlFor="recipe-url"
                  className="mt-5 block text-sm font-semibold uppercase tracking-[0.2em] text-ink/55"
                >
                  Recipe URL
                </label>
                <input
                  id="recipe-url"
                  type="url"
                  value={recipeUrl}
                  onChange={(event) => setRecipeUrl(event.target.value)}
                  placeholder="https://example.com/recipe"
                  disabled={isBusy}
                  className="mt-3 block w-full border border-sand bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-accent"
                />

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleImportFromUrl}
                    disabled={isBusy || !recipeUrl.trim()}
                    className="rounded-sm border border-ink bg-ink px-6 py-3 text-sm font-semibold text-canvas transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="flex items-center gap-2">
                      {isImporting ? (
                        <span className="h-4 w-4 animate-spin border-2 border-white/40 border-t-white" />
                      ) : null}
                      <span>{isImporting ? "Importing recipe..." : "Import Recipe"}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={isBusy}
                    className="border border-sand bg-white px-5 py-3 text-sm font-semibold text-ink/75 transition hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Clear
                  </button>
                </div>

                <div className="mt-5 border border-sand bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/55">
                    Supported formats
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-ink/70">
                    <li>• JSON-LD schema (most recipe sites)</li>
                    <li>• Microdata markup</li>
                    <li>• Plain text (AI fallback)</li>
                  </ul>
                </div>
              </section>
            )}

            {activeTab === "image" && (
              <section className="border border-sand bg-canvas p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-herb">
                      Photo upload
                    </p>
                    <p className="mt-2 text-sm leading-6 text-ink/70">
                      Upload a food photo to identify the dish and generate a structured recipe.
                    </p>
                  </div>
                  {identifiedDishName ? (
                    <div className="border border-sand bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-ink">
                      {identifiedDishName}
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
                  className="mt-3 block w-full border border-sand bg-white px-4 py-3 text-sm text-ink file:mr-4 file:rounded-sm file:border file:border-ink file:bg-ink file:px-4 file:py-2 file:text-sm file:font-semibold file:text-canvas"
                />

                {imagePreviewUrl ? (
                  <div className="mt-4 overflow-hidden border border-sand bg-white">
                    <img
                      src={imagePreviewUrl}
                      alt="Selected dish preview"
                      className="h-56 w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="mt-4 border border-dashed border-sand bg-white px-4 py-8 text-center text-sm text-ink/55">
                    Your selected image preview appears here before submission.
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleIdentifyDish}
                    disabled={isBusy || !selectedImage}
                    className="rounded-sm border border-ink bg-ink px-6 py-3 text-sm font-semibold text-canvas transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="flex items-center gap-2">
                      {isIdentifying ? (
                        <span className="h-4 w-4 animate-spin border-2 border-white/40 border-t-white" />
                      ) : null}
                      <span>{isIdentifying ? "Identifying dish..." : "Generate From Photo"}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={isBusy}
                    className="border border-sand bg-white px-5 py-3 text-sm font-semibold text-ink/75 transition hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Clear
                  </button>
                </div>
                {visionLabels.length ? (
                  <div className="mt-4">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">
                      Labels: {visionLabels.join(" • ")}
                    </span>
                  </div>
                ) : null}
              </section>
            )}

            {activeTab === "text" && (
              <>
                <label
                  htmlFor="recipe-text"
                  className="block text-sm font-semibold uppercase tracking-[0.2em] text-ink/55"
                >
                  Recipe source text
                </label>
                <textarea
                  id="recipe-text"
                  value={recipeText}
                  onChange={(event) => setRecipeText(event.target.value)}
                  placeholder="Paste recipe text here..."
                  className="mt-3 min-h-[20rem] w-full border border-sand bg-white px-5 py-5 text-sm leading-7 text-ink outline-none transition focus:border-accent lg:min-h-[28rem]"
                />

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleParseRecipe}
                    disabled={isBusy}
                    className="rounded-sm border border-ink bg-ink px-6 py-3 text-sm font-semibold text-canvas transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="flex items-center gap-2">
                      {isParsing ? (
                        <span className="h-4 w-4 animate-spin border-2 border-white/40 border-t-white" />
                      ) : null}
                      <span>{isParsing ? "Parsing recipe..." : "Parse Recipe"}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecipeText(starterPrompt)}
                    disabled={isBusy}
                    className="border border-sand bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-ink disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Load Example
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={isBusy}
                    className="border border-sand bg-white px-5 py-3 text-sm font-semibold text-ink/75 transition hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Clear
                  </button>
                </div>
              </>
            )}

            {error ? (
              <div className="mt-4 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            {saveMessage ? (
              <div className="mt-4 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {saveMessage}
              </div>
            ) : null}
          </div>
        </div>

        <article className="overflow-hidden border border-sand bg-white">
          <div className="border-b border-sand/80 px-6 py-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-herb">
              Recipe Preview
            </p>
            <h2 className="mt-2 font-display text-3xl text-ink">
              {parsedRecipe ? parsedRecipe.title : "Your recipe will appear here"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-ink/70">
              {parsedRecipe?.description ??
                "Upload an image, paste recipe text, import from a URL, or type a dish name to get started. Your structured recipe will display here."}
            </p>
          </div>

          <div className="p-5 sm:p-6 lg:max-h-[calc(100vh-13rem)] lg:overflow-y-auto">
            {parsedRecipe ? (
              <div className="grid gap-6">
                {extractionMethod ? (
                  <section className="border border-sand/80 bg-white/80 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink/55">
                      Import method
                    </p>
                    <h3 className="mt-3 font-display text-2xl text-ink">
                      {extractionMethod === "json-ld" && "JSON-LD Schema"}
                      {extractionMethod === "microdata" && "Microdata Markup"}
                      {extractionMethod === "gemini-fallback" && "AI Fallback"}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-ink/70">
                      Recipe data was extracted using structured markup from the source website.
                    </p>
                  </section>
                ) : null}

                {visionLabels.length ? (
                  <section className="border border-sand/80 bg-white/80 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink/55">
                      Vision reading
                    </p>
                    <h3 className="mt-3 font-display text-2xl text-ink">
                      {identifiedDishName ?? "Dish identified from photo"}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-ink/70">
                      Google Cloud Vision extracted these cues before Gemini generated the recipe.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {visionLabels.map((label) => (
                        <span
                          key={label}
                          className="border border-sand bg-canvas px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink/65"
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
                    <div className="space-y-4">
                      <CollectionSelector
                        selectedCollectionIds={selectedCollectionIds}
                        onSelectionChange={setSelectedCollectionIds}
                        collections={collections}
                        onCreateNew={() => setIsCollectionModalOpen(true)}
                      />
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={handleSaveRecipe}
                          disabled={isBusy}
                          className="rounded-sm bg-herb px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isSaving ? "Saving recipe..." : "Save Recipe"}
                        </button>
                        <Link
                          href="/dashboard"
                          className="border border-ink/10 px-5 py-3 text-sm font-semibold text-ink/80 transition hover:border-accent hover:text-accent"
                        >
                          View Dashboard
                        </Link>
                      </div>
                    </div>
                  }
                />

                <CollectionModal
                  isOpen={isCollectionModalOpen}
                  onClose={() => setIsCollectionModalOpen(false)}
                  onSave={handleCreateCollection}
                />

                <section className="border border-dashed border-sand bg-white/60 p-5">
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
                <div className="border border-sand/80 bg-white/80 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">
                    Ready to process
                  </p>
                  <h3 className="mt-2 font-display text-2xl text-ink">Ingredients & Quantities</h3>
                  <p className="mt-3 text-sm leading-6 text-ink/70">
                    AI will extract all ingredients with precise measurements and convert them into a clean, structured format.
                  </p>
                </div>
                <div className="border border-sand/80 bg-canvas/80 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">
                    Ready to process
                  </p>
                  <h3 className="mt-2 font-display text-2xl text-ink">Cooking Instructions</h3>
                  <p className="mt-3 text-sm leading-6 text-ink/70">
                    Step-by-step cooking instructions will be organized in the correct order with clear, easy-to-follow directions.
                  </p>
                </div>
                <div className="border border-sand/80 bg-white/80 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">
                    Ready to process
                  </p>
                  <h3 className="mt-2 font-display text-2xl text-ink">Recipe Details</h3>
                  <p className="mt-3 text-sm leading-6 text-ink/70">
                    Servings, cooking time, dietary tags, and other helpful information will be automatically identified and displayed.
                  </p>
                </div>
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
    <div className="border border-sand/80 bg-canvas px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">{label}</p>
      <p className="mt-2 font-display text-3xl text-ink">{value}</p>
    </div>
  );
}

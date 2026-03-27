import { RecipeCard } from "@/components/recipe-card";

export default function UploadPage() {
  return (
    <section className="mx-auto grid max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[1fr_0.9fr]">
      <div className="recipe-shell rounded-[2rem] border border-white/60 p-8 shadow-card">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accentDark">
          Upload flow scaffold
        </p>
        <h1 className="mt-4 font-display text-4xl text-ink">Paste or upload a recipe</h1>
        <textarea
          placeholder="Paste recipe text here..."
          className="mt-8 min-h-64 w-full rounded-[1.5rem] border border-sand bg-white px-4 py-4 outline-none"
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white"
          >
            Parse Recipe
          </button>
          <button
            type="button"
            className="rounded-full border border-ink/10 px-5 py-3 text-sm font-semibold text-ink"
          >
            Upload Image
          </button>
        </div>
      </div>
      <RecipeCard
        title="Preview area"
        description="Parsed output will render here once the FastAPI parsing endpoint is wired up on Day 4 and the UI flow is connected on Day 5."
        tags={["day-4", "day-5"]}
      />
    </section>
  );
}

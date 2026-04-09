import Link from "next/link";
import type { Metadata } from "next";

const features = [
  {
    title: "Image Recognition",
    description: "Upload a food photo and AI identifies the dish, then generates a complete recipe.",
  },
  {
    title: "Text Parsing",
    description: "Paste messy recipe text—even WhatsApp-style formats—and transform it into clean structure.",
  },
  {
    title: "Smart Scaling",
    description: "Adjust servings and ingredient quantities recalculate automatically in real time.",
  },
  {
    title: "Localization",
    description: "Adapt recipes to regional ingredients and cooking styles for your local context.",
  },
  {
    title: "Substitutions",
    description: "Missing an ingredient? Get AI-powered alternatives with flavor impact notes.",
  },
  {
    title: "Nutrition Analysis",
    description: "View calories, macros, and dietary flags calculated per serving automatically.",
  },
];

export const metadata: Metadata = {
  title: "Home",
  description:
    "Discover RecipeAI, an AI-powered cooking assistant for turning photos and messy recipe text into structured, interactive meals.",
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6">
      <section className="border-b border-sand pb-16">
        <div className="max-w-3xl">
          <h1 className="font-display text-3xl leading-tight text-ink sm:text-4xl md:text-5xl lg:text-6xl">
            Turn any recipe into structured, interactive cooking instructions
          </h1>
          <p className="mt-6 text-base leading-relaxed text-ink/70 sm:text-lg">
            RecipeAI uses Google Gemini and Vision APIs to parse recipe text, identify dishes from photos,
            and transform them into clean, scalable, localized recipes with nutritional insights.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/upload"
              className="border border-ink bg-ink px-6 py-3 text-sm font-semibold uppercase tracking-wider text-canvas transition hover:bg-ink/90 sm:px-8 sm:py-4"
            >
              Upload Recipe
            </Link>
            <Link
              href="/dashboard"
              className="border border-sand bg-white px-6 py-3 text-sm font-semibold uppercase tracking-wider text-ink transition hover:border-ink sm:px-8 sm:py-4"
            >
              View Dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="pt-16">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/50 sm:text-sm">Features</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="border border-sand bg-white p-5 sm:p-6">
              <h3 className="font-display text-lg text-ink sm:text-xl">{feature.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 border border-sand bg-white p-6 sm:p-10">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl text-ink sm:text-3xl">Built with modern tools</h2>
          <p className="mt-4 text-sm leading-relaxed text-ink/70">
            Next.js 15, FastAPI, Supabase Auth & PostgreSQL, Google Gemini API, Google Cloud Vision API.
            Deployed on Vercel and Render with full CI/CD integration.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="https://github.com/Giathi-Daniel/RecipeAI---Snap-Scan-Cook"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-sand px-5 py-2 text-sm font-semibold uppercase tracking-wider text-ink transition hover:border-ink sm:px-6 sm:py-3"
            >
              View on GitHub
            </a>
            <a
              href="https://linkedin.com/in/daniel-giathi"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-sand px-5 py-2 text-sm font-semibold uppercase tracking-wider text-ink transition hover:border-ink sm:px-6 sm:py-3"
            >
              Connect on LinkedIn
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

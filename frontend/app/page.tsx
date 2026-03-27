import Link from "next/link";
import type { Metadata } from "next";
import { RecipeCard } from "@/components/recipe-card";

const highlights = [
  "Upload a food photo and let AI identify the dish.",
  "Paste messy recipe text and transform it into clean structure.",
  "Save, scale, and personalize recipes for real-world cooking.",
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
    <div className="mx-auto max-w-6xl px-6 pb-16 pt-6">
      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="recipe-shell rounded-[2rem] border border-white/60 px-8 py-12 shadow-card">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accentDark">
            Day 1 foundation
          </p>
          <h1 className="mt-4 max-w-2xl font-display text-5xl leading-tight text-ink">
            A structured home base for RecipeAI&apos;s Next.js experience.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-ink/70">
            The frontend is now scaffolded for auth, uploads, recipe viewing, and dashboard flows
            so we can move straight into feature work on Day 2.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/upload"
              className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white"
            >
              Start Upload Flow
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-ink/10 px-6 py-3 text-sm font-semibold text-ink"
            >
              View Dashboard
            </Link>
          </div>
        </div>
        <div className="grid gap-4">
          {highlights.map((highlight, index) => (
            <RecipeCard
              key={highlight}
              title={`Core capability ${index + 1}`}
              description={highlight}
              tags={["foundation", "nextjs"]}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

import { redirect } from "next/navigation";
import { RecipeCard } from "@/components/recipe-card";
import { LogoutButton } from "@/components/logout-button";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const savedRecipes = [
  {
    title: "Braised Coconut Chicken",
    description: "Saved recipes will appear here with tags, servings, and quick actions.",
    tags: ["saved", "high-protein"],
  },
  {
    title: "Smoky Jollof Rice",
    description: "Dashboard scaffolding is in place for Day 11 list, filter, and delete flows.",
    tags: ["west-africa", "one-pot"],
  },
];

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    redirect("/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-herb">
            Personal space
          </p>
          <h1 className="mt-3 font-display text-4xl text-ink">Your recipe dashboard</h1>
          <p className="mt-3 text-sm text-ink/70">
            Signed in as <span className="font-semibold text-ink">{user.email}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="border-l border-sand pl-4 text-sm text-ink/70">
            Search and filters land on Day 11
          </div>
          <LogoutButton />
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {savedRecipes.map((recipe) => (
          <RecipeCard key={recipe.title} {...recipe} />
        ))}
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Log In",
  description: "Sign in to RecipeAI to manage saved recipes, uploads, and personalized cooking tools.",
  alternates: {
    canonical: "/login",
  },
};

export default async function LoginPage() {
  const supabase = await createServerSupabaseClient();

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/dashboard");
    }
  }

  return (
    <section className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="recipe-shell border border-sand p-5 sm:p-8">
        <h1 className="mt-4 font-display text-2xl text-ink sm:text-3xl lg:text-4xl">Log in to RecipeAI</h1>
        <p className="mt-4 text-sm leading-6 text-ink/70">
          Sign in with your email and password to get back to saved recipes, uploads, and your dashboard.
        </p>
        <AuthForm mode="login" />
      </div>
    </section>
  );
}

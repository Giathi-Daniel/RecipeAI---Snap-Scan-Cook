import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a RecipeAI account to save recipes, analyze ingredients, and personalize meals.",
  alternates: {
    canonical: "/signup",
  },
};

export default async function SignupPage() {
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
        <h1 className="mt-4 font-display text-2xl text-ink sm:text-3xl lg:text-4xl">Create your RecipeAI account</h1>
        <p className="mt-4 text-sm leading-6 text-ink/70">
          Create an account with email and password. If email confirmation is enabled, we&apos;ll guide users back here after verification.
        </p>
        <AuthForm mode="signup" />
      </div>
    </section>
  );
}

import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

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
    <section className="mx-auto max-w-xl px-6 py-12">
      <div className="recipe-shell rounded-[2rem] border border-white/60 p-8 shadow-card">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-herb">Get started</p>
        <h1 className="mt-4 font-display text-4xl text-ink">Create your RecipeAI account</h1>
        <p className="mt-4 text-sm leading-6 text-ink/70">
          Create an account with email and password. If email confirmation is enabled, we&apos;ll guide users back here after verification.
        </p>
        <AuthForm mode="signup" />
      </div>
    </section>
  );
}

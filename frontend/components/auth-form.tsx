"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import {
  normalizeNextPath,
  sanitizeEmail,
  sanitizeFullName,
  validatePasswordStrength,
} from "@/lib/security";
import { createBrowserSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthMode;
};

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const nextPath = useMemo(() => normalizeNextPath(searchParams.get("next")), [searchParams]);
  const isLogin = mode === "login";
  const configReady = hasSupabaseConfig();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      setError("Add your Supabase URL and anon key to the frontend environment before testing auth.");
      return;
    }

    setIsSubmitting(true);

    try {
      const sanitizedEmail = sanitizeEmail(email);
      const sanitizedFullName = sanitizeFullName(fullName);

      if (!isLogin) {
        const passwordError = validatePasswordStrength(password);
        if (passwordError) {
          throw new Error(passwordError);
        }
      }

      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: sanitizedEmail,
          password,
        });

        if (signInError) {
          throw signInError;
        }

        router.replace(nextPath);
        router.refresh();
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          data: {
            full_name: sanitizedFullName,
          },
          emailRedirectTo: `${getSiteUrl()}/login`,
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.session) {
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      setSuccess("Check your inbox to verify your email, then come back here to log in.");
      setFullName("");
      setEmail("");
      setPassword("");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Something went wrong.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
      {!configReady ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Supabase keys are not configured yet. Add them to `.env.local` before testing this flow.
        </div>
      ) : null}

      {!isLogin ? (
        <input
          type="text"
          value={fullName}
          onChange={(event) => setFullName(sanitizeFullName(event.target.value))}
          placeholder="Full name"
          className="w-full border border-sand bg-white px-4 py-3 outline-none transition focus:border-accent"
          autoComplete="name"
          required
        />
      ) : null}

      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(sanitizeEmail(event.target.value))}
        placeholder="Email address"
        className="w-full border border-sand bg-white px-4 py-3 outline-none transition focus:border-accent"
        autoComplete="email"
        required
      />

      <input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Password"
        className="w-full border border-sand bg-white px-4 py-3 outline-none transition focus:border-accent"
        autoComplete={isLogin ? "current-password" : "new-password"}
        minLength={8}
        required
      />

      {error ? (
        <p className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="border border-herb/20 bg-herb/10 px-4 py-3 text-sm text-herb">
          {success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full border border-ink bg-ink px-4 py-3 font-semibold text-canvas transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Working..." : isLogin ? "Log in" : "Create account"}
      </button>

      <p className="text-sm text-ink/70">
        {isLogin ? "Need an account?" : "Already verified and ready to cook?"}{" "}
        <Link
          href={isLogin ? "/signup" : "/login"}
          className="font-semibold text-accentDark hover:text-accent"
        >
          {isLogin ? "Sign up" : "Log in"}
        </Link>
      </p>
    </form>
  );
}

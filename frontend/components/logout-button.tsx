"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";

export function LogoutButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      router.replace("/login");
      return;
    }

    setIsSubmitting(true);
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isSubmitting}
      className="rounded-full border border-ink/10 px-4 py-2 text-sm font-medium text-ink/70 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-70"
    >
      {isSubmitting ? "Signing out..." : "Log out"}
    </button>
  );
}

import Link from "next/link";
import Image from "next/image";
import { LogoutButton } from "@/components/logout-button";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const sharedLinks = [
  { href: "/upload", label: "Upload" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/recipe/demo-recipe", label: "Recipe View" },
];

export async function Header() {
  const supabase = await createServerSupabaseClient();
  const user =
    supabase
      ? (
          await supabase.auth.getUser()
        ).data.user
      : null;

  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
      <Link href="/" className="flex items-center gap-2 font-display text-2xl font-semibold tracking-tight">
        <Image src="/android-chrome-192x192.png" alt="RecipeAI logo" width={32} height={32} />
        RecipeAI
      </Link>
      <nav className="flex items-center gap-4 text-sm font-medium text-ink/70">
        {sharedLinks.map((link) => (
          <Link key={link.href} href={link.href} className="hover:text-accent">
            {link.label}
          </Link>
        ))}
        {user ? (
          <LogoutButton />
        ) : (
          <>
            <Link href="/login" className="hover:text-accent">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-accent px-4 py-2 text-white hover:bg-accentDark"
            >
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}

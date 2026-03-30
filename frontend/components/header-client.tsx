"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { LogoutButton } from "@/components/logout-button";
import { cn } from "@/utils/cn";

type NavLink = {
  href: string;
  label: string;
};

type HeaderClientProps = {
  links: NavLink[];
  isAuthenticated: boolean;
};

export function HeaderClient({ links, isAuthenticated }: HeaderClientProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-canvas/85 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center justify-between py-4">
          <Link
            href="/"
            className="flex items-center gap-3 font-display text-2xl font-semibold tracking-tight text-ink"
            onClick={closeMenu}
          >
            <Image src="/android-chrome-192x192.png" alt="RecipeAI logo" width={36} height={36} />
            <div className="leading-none">
              <div>RecipeAI</div>
              <div className="mt-1 text-[11px] font-body uppercase tracking-[0.24em] text-ink/45">
                Snap, Scan & Cook
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-5 text-sm font-medium text-ink/70 md:flex">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-accent">
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
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

          <button
            type="button"
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-sand bg-white text-ink shadow-sm transition hover:border-accent hover:text-accent md:hidden"
          >
            <span className="relative block h-4 w-5">
              <span
                className={cn(
                  "absolute left-0 top-0 h-0.5 w-5 rounded-full bg-current transition",
                  isMenuOpen && "top-[7px] rotate-45",
                )}
              />
              <span
                className={cn(
                  "absolute left-0 top-[7px] h-0.5 w-5 rounded-full bg-current transition",
                  isMenuOpen && "opacity-0",
                )}
              />
              <span
                className={cn(
                  "absolute left-0 top-[14px] h-0.5 w-5 rounded-full bg-current transition",
                  isMenuOpen && "top-[7px] -rotate-45",
                )}
              />
            </span>
          </button>
        </div>

        <div
          className={cn(
            "grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 md:hidden",
            isMenuOpen ? "grid-rows-[1fr] pb-4 opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="min-h-0">
            <div className="rounded-[1.75rem] border border-white/70 bg-white/80 p-4 shadow-card">
              <nav className="grid gap-2 text-sm font-medium text-ink/75">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-2xl px-4 py-3 transition hover:bg-canvas hover:text-accent"
                    onClick={closeMenu}
                  >
                    {link.label}
                  </Link>
                ))}
                {isAuthenticated ? (
                  <div className="px-2 pt-2">
                    <LogoutButton />
                  </div>
                ) : (
                  <div className="grid gap-2 pt-2">
                    <Link
                      href="/login"
                      className="rounded-2xl px-4 py-3 transition hover:bg-canvas hover:text-accent"
                      onClick={closeMenu}
                    >
                      Log in
                    </Link>
                    <Link
                      href="/signup"
                      className="rounded-2xl bg-accent px-4 py-3 text-center text-white transition hover:bg-accentDark"
                      onClick={closeMenu}
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </nav>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

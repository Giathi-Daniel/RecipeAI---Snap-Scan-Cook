import Link from "next/link";

const links = [
  { href: "/upload", label: "Upload" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/recipe/demo-recipe", label: "Recipe View" },
  { href: "/login", label: "Log in" },
];

export function Header() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
      <Link href="/" className="font-display text-2xl font-semibold tracking-tight">
        RecipeAI
      </Link>
      <nav className="flex items-center gap-4 text-sm font-medium text-ink/70">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="hover:text-accent">
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

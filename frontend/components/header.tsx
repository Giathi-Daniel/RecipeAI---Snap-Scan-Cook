import Link from "next/link";
import { HeaderClient } from "@/components/header-client";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const sharedLinks = [
  { href: "/upload", label: "Upload" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/recipe/demo", label: "Recipe View" },
];

export async function Header() {
  let user = null;

  try {
    const supabase = await createServerSupabaseClient();
    user = supabase ? (await supabase.auth.getUser()).data.user : null;
  } catch {
    user = null;
  }

  return (
    <HeaderClient
      links={sharedLinks}
      isAuthenticated={Boolean(user)}
    />
  );
}

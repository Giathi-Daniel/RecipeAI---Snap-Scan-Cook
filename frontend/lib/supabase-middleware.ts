import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase";

type SupabaseCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

export async function updateSession(request: NextRequest) {
  const config = getSupabaseConfig();

  if (!config) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: SupabaseCookie[]) {
        cookiesToSet.forEach(({ name, value }: SupabaseCookie) => request.cookies.set(name, value));

        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }: SupabaseCookie) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard");
  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup");

  if (isDashboardRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

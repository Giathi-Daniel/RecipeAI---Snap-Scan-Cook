import { createBrowserSupabaseClient } from "./supabase";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  process.env.BACKEND_URL ??
  "http://localhost:8000";

type AuthFetchOptions = {
  method?: string;
  body?: unknown;
  headers?: HeadersInit;
};

export async function authFetch<T>(
  path: string,
  options: AuthFetchOptions = {},
): Promise<T> {
  const supabase = createBrowserSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error("Authentication required. Please sign in.");
  }

  const { method = "GET", body, headers = {} } = options;

  const fetchOptions: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      ...headers,
    },
  };

  if (body && method !== "GET") {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(`${BACKEND_URL}${path}`, fetchOptions);

  if (!response.ok) {
    let detail = `Request failed: ${response.status}`;
    try {
      const errorBody = (await response.json()) as { detail?: string };
      if (errorBody.detail) {
        detail = errorBody.detail;
      }
    } catch {
      // Keep fallback error
    }
    throw new Error(detail);
  }

  return response.json() as Promise<T>;
}

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

async function fetchWithToken<T>(
  token: string,
  path: string,
  options: AuthFetchOptions,
): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const fetchOptions: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
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

export async function authFetch<T>(
  path: string,
  options: AuthFetchOptions = {},
): Promise<T> {
  const supabase = createBrowserSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data: { session }, error } = await supabase.auth.getSession();

  if (!error && session?.access_token) {
    return fetchWithToken<T>(session.access_token, path, options);
  }

  // Session missing — try a refresh before giving up
  const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();

  if (refreshError || !refreshed.session?.access_token) {
    throw new Error("Authentication required. Please sign in.");
  }

  return fetchWithToken<T>(refreshed.session.access_token, path, options);
}

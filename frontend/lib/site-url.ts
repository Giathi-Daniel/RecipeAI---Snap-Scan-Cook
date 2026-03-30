const FALLBACK_SITE_URL = "http://localhost:3000";

export function getSiteUrl(): string {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!configuredSiteUrl) {
    return FALLBACK_SITE_URL;
  }

  try {
    return new URL(configuredSiteUrl).toString().replace(/\/$/, "");
  } catch {
    return FALLBACK_SITE_URL;
  }
}

export function getSiteUrlObject(): URL {
  return new URL(getSiteUrl());
}

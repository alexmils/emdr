/**
 * OG image URL helpers — client-safe (no DB / pg).
 */

import type { SeoPageId } from "@/lib/seo-config";

/**
 * Absolute URL for og:image meta (never a data URL — crawlers need http(s)).
 * Data URLs are served from `/og-image`.
 */
export function absoluteOgImageUrl(opts: {
  stored: string;
  origin: string;
  pageId: SeoPageId;
  hasPageOverride: boolean;
  fallback: string;
}): string {
  const t = opts.stored.trim();
  if (!t) return opts.fallback;
  if (t.startsWith("data:image/")) {
    const q = opts.hasPageOverride
      ? `page=${opts.pageId}`
      : "scope=default";
    return `${opts.origin}/og-image?${q}`;
  }
  if (t.startsWith("/")) return `${opts.origin}${t}`;
  return t;
}

/** Preview src for admin UI — data URLs work in <img>; meta uses absoluteOgImageUrl. */
export function displayOgImageUrl(
  stored: string | undefined,
  fallbackAbsolute: string
): string {
  const t = (stored || "").trim();
  if (!t) return fallbackAbsolute;
  return t;
}

/**
 * OG image URL helpers — client-safe (no DB / pg).
 */

import type { SeoPageId } from "@/lib/seo-config";

/**
 * Absolute URL for og:image meta (never a data URL — crawlers need http(s)).
 * Data URLs are served from `/og-image`. Empty stored → dynamic `/og` card.
 */
export function absoluteOgImageUrl(opts: {
  stored: string;
  origin: string;
  pageId: SeoPageId;
  hasPageOverride: boolean;
  fallback: string;
  /** Page title for dynamic OG when no custom image is set. */
  title?: string;
  kicker?: string;
}): string {
  const t = opts.stored.trim();
  if (!t) {
    if (opts.title?.trim()) {
      const q = new URLSearchParams({ title: opts.title.trim() });
      if (opts.kicker?.trim()) q.set("kicker", opts.kicker.trim());
      return `${opts.origin}/og?${q.toString()}`;
    }
    return opts.fallback;
  }
  if (t.startsWith("data:image/")) {
    const q = opts.hasPageOverride
      ? `page=${opts.pageId}`
      : "scope=default";
    return `${opts.origin}/og-image?${q}`;
  }
  if (t.startsWith("/")) return `${opts.origin}${t}`;
  return t;
}

/** Build `/og?title=…` share card URL (1200×630). */
export function dynamicOgImageUrl(
  origin: string,
  title: string,
  kicker?: string
): string {
  const base = origin.replace(/\/$/, "");
  const q = new URLSearchParams({ title: title.trim().slice(0, 120) });
  if (kicker?.trim()) q.set("kicker", kicker.trim().slice(0, 48));
  return `${base}/og?${q.toString()}`;
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

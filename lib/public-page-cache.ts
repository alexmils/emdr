/** ISR + on-demand revalidation for public marketing pages. */

export const SEO_CACHE_TAG = "seo";

/** Hourly ISR — copy/SEO change on edit, not per request. */
export const PUBLIC_PAGE_REVALIDATE_SECONDS = 3600;

/**
 * Public marketing routes that were `force-dynamic` (no-store HTML).
 * Keep in sync with `SITE_SEO_DEFAULTS` paths in `lib/site-seo.ts`.
 */
export const PUBLIC_ISR_PATHS = [
  "/",
  "/about",
  "/about/clinical-team",
  "/editorial",
  "/emdr",
  "/resources",
  "/blog",
  "/privacy",
  "/terms",
] as const;

export type PublicIsrPath = (typeof PUBLIC_ISR_PATHS)[number];

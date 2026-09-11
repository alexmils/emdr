/** Public-site SEO + marketing tags — Admin → SEO (`app_settings.seo`). */

export const SEO_PAGE_IDS = [
  "home",
  "about",
  "emdr",
  "resources",
  "privacy",
  "terms",
] as const;

export type SeoPageId = (typeof SEO_PAGE_IDS)[number];

export type SeoPageOverride = {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogImageUrl?: string;
};

export type PlatformSeoConfig = {
  pages: Partial<Record<SeoPageId, SeoPageOverride>>;
  ga4MeasurementId: string;
  gtmId: string;
  clarityId: string;
  gscVerification: string;
  gscProperty: string;
  bingVerification: string;
  ignoreIps: string;
  /** Google service account JSON for Analytics tab (GA4 + Search Console). */
  googleServiceAccountJson: string;
  /** Numeric GA4 property id, or `properties/123…`. */
  ga4PropertyId: string;
};

export const DEFAULT_PLATFORM_SEO: PlatformSeoConfig = {
  pages: {},
  ga4MeasurementId: "",
  gtmId: "",
  clarityId: "",
  gscVerification: "",
  gscProperty: "",
  bingVerification: "",
  ignoreIps: "",
  googleServiceAccountJson: "",
  ga4PropertyId: "",
};

function str(raw: unknown, max = 500): string {
  if (typeof raw !== "string") return "";
  return raw.trim().slice(0, max);
}

function normalizePageOverride(raw: unknown): SeoPageOverride | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const out: SeoPageOverride = {};
  const title = str(o.title, 200);
  const description = str(o.description, 500);
  const ogTitle = str(o.ogTitle, 200);
  const ogImageUrl = str(o.ogImageUrl, 2000);
  if (title) out.title = title;
  if (description) out.description = description;
  if (ogTitle) out.ogTitle = ogTitle;
  if (ogImageUrl && isAllowedOgImageUrl(ogImageUrl)) out.ogImageUrl = ogImageUrl;
  return Object.keys(out).length ? out : null;
}

export function normalizeSeoConfig(raw: unknown): PlatformSeoConfig {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_PLATFORM_SEO, pages: {} };
  }
  const r = raw as Partial<PlatformSeoConfig> & {
    pages?: Record<string, unknown>;
  };
  const pages: Partial<Record<SeoPageId, SeoPageOverride>> = {};
  if (r.pages && typeof r.pages === "object") {
    for (const id of SEO_PAGE_IDS) {
      const override = normalizePageOverride(r.pages[id]);
      if (override) pages[id] = override;
    }
  }
  return {
    pages,
    ga4MeasurementId: str(r.ga4MeasurementId, 40),
    gtmId: str(r.gtmId, 40),
    clarityId: str(r.clarityId, 40),
    gscVerification: str(r.gscVerification, 200),
    gscProperty: str(r.gscProperty, 200),
    bingVerification: str(r.bingVerification, 200),
    ignoreIps: str(r.ignoreIps, 2000),
    googleServiceAccountJson: str(r.googleServiceAccountJson, 200_000),
    ga4PropertyId: str(r.ga4PropertyId, 80),
  };
}

export function isSeoConfigEmpty(seo: PlatformSeoConfig): boolean {
  return (
    Object.keys(seo.pages).length === 0 &&
    !seo.ga4MeasurementId &&
    !seo.gtmId &&
    !seo.clarityId &&
    !seo.gscVerification &&
    !seo.gscProperty &&
    !seo.bingVerification &&
    !seo.ignoreIps &&
    !seo.googleServiceAccountJson &&
    !seo.ga4PropertyId
  );
}

const GA4_ID_RE = /^G-[A-Z0-9]+$/i;
const GTM_ID_RE = /^GTM-[A-Z0-9]+$/i;
const CLARITY_ID_RE = /^[A-Za-z0-9]+$/;

export function isValidGa4Id(id: string): boolean {
  return GA4_ID_RE.test(id.trim());
}

export function isValidGtmId(id: string): boolean {
  return GTM_ID_RE.test(id.trim());
}

export function isValidClarityId(id: string): boolean {
  const t = id.trim();
  return t.length >= 4 && CLARITY_ID_RE.test(t);
}

/** Allow https URLs or same-origin paths for OG images. */
export function isAllowedOgImageUrl(url: string): boolean {
  const t = url.trim();
  if (!t) return false;
  if (t.startsWith("/") && !t.startsWith("//")) return true;
  try {
    const u = new URL(t);
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

export function maskPublicId(id: string, visible = 4): string {
  const t = id.trim();
  if (!t) return "";
  if (t.length <= visible) return "••••";
  return `••••${t.slice(-visible)}`;
}

export function parseServiceAccountEmail(json: string): string | null {
  const t = json.trim();
  if (!t) return null;
  try {
    const data = JSON.parse(t) as { client_email?: unknown };
    const email =
      typeof data.client_email === "string" ? data.client_email.trim() : "";
    return email || null;
  } catch {
    return null;
  }
}

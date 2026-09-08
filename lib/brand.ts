/** Spoken name — UI chrome, email from-name, Stripe Checkout. */
export const BRAND_SPOKEN = "Nura";

/** Legal lockup — logo, Terms, copyright, App Store, Stripe legal. */
export const BRAND_LEGAL = "NuraHelp";

/** Current product line — a feature, not the company name. */
export const BRAND_PRODUCT = "EMDR Support";

export const BRAND_DOMAIN = "nurahelp.com";

export const BRAND_TAGLINE = "Support for therapy. Starting with EMDR.";

export const BRAND_DESCRIPTION =
  "A calm place for guided EMDR sessions, therapy resources, and support. Self-help — not a licensed therapist.";

export const BRAND_TITLE = "Nura — guided EMDR, therapy resources, and support";

export const BRAND_COLORS = {
  paper: "#F8F2D2",
  gold: "#D3BC84",
  earth: "#785135",
  ink: "#2A2118",
  sidebar: "#1C1814",
} as const;

const LEGACY_CHROME_NAMES = new Set([
  "NuraHelp AI",
  "NuraHelpAI",
  "Nura Help AI",
]);

/**
 * Map leftover “NuraHelp AI” defaults to the spoken name.
 * Custom admin names are kept.
 */
export function chromeBrandName(raw?: string | null): string {
  const v = raw?.trim() ?? "";
  if (!v || LEGACY_CHROME_NAMES.has(v)) return BRAND_SPOKEN;
  return v;
}

/** Rewrite leftover “NuraHelp AI” (and a few old help defaults) in stored copy. */
export function rewriteRetiredBrandCopy(text: string): string {
  return text
    .replaceAll("NuraHelp AI", BRAND_SPOKEN)
    .replaceAll("NuraHelpAI", BRAND_SPOKEN)
    .replaceAll("Nura Help AI", BRAND_SPOKEN)
    .replaceAll("NuraHelp assistant", "Nura assistant")
    .replaceAll("NuraHelp product", "Nura product")
    .replaceAll("What NuraHelp is", "What Nura is");
}

export function brandMetadataBase(): URL {
  const raw = process.env.APP_URL?.trim() || `https://${BRAND_DOMAIN}`;
  try {
    return new URL(raw);
  } catch {
    return new URL(`https://${BRAND_DOMAIN}`);
  }
}

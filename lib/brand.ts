/** Spoken name — UI chrome, email from-name, Stripe Checkout. */
export const BRAND_SPOKEN = "Nura";

/** Legal lockup — logo, Terms, copyright, App Store, Stripe legal. */
export const BRAND_LEGAL = "NuraHelp";

/** Current product line — a feature, not the company name. */
export const BRAND_PRODUCT = "EMDR Support";

export const BRAND_DOMAIN = "nurahelp.com";

export const BRAND_TAGLINE = "Support for therapy. Starting with EMDR.";

export const BRAND_DESCRIPTION =
  "Guided EMDR therapy in a calm online app — visual sets, optional voice, and resources. Self-help, not a licensed therapist.";

/** Title stem for `/` — layout template adds ` — Nura`. */
export const BRAND_TITLE_STEM = "Guided EMDR therapy online app";

export const BRAND_TITLE = `${BRAND_TITLE_STEM} — ${BRAND_SPOKEN}`;

/** Circular wordmark for marketing bylines (home blog cards, etc.). */
export const BRAND_CIRCLE_AVATAR = "/brand/nura-circle-variants/A-white-on-sage-128.png";

/** Pistachio palette — see docs/brand.md */
export const BRAND_COLORS = {
  paper: "#A4EDA5",
  gold: "#C6D67E",
  earth: "#84B067",
  olive: "#948F4E",
  ink: "#2A3020",
  sidebar: "#3D4129",
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
    .replaceAll("What NuraHelp is", "What Nura is")
    .replaceAll(
      "guided sessions and bilateral stimulation (BLS)",
      "guided sessions and a moving ball for visual sets"
    )
    .replaceAll(
      "overview of bilateral stimulation and how guided sessions",
      "overview of the moving ball and how Guided sessions"
    )
    .replaceAll(
      "many people use **bilateral stimulation** — rhythmically tracking something left and right",
      "many people follow **a moving target left and right** — like the ball in Free or Guided mode"
    )
    .replaceAll(
      "**bilateral stimulation** — rhythmically tracking something left and right",
      "**a moving target left and right** — like the ball in Free or Guided mode"
    )
    .replaceAll(
      "bilateral stimulation — rhythmically tracking something left and right",
      "a moving target left and right — like the ball in Free or Guided mode"
    )
    .replaceAll("bilateral stimulation", "left-and-right eye tracking")
    .replaceAll(
      "many people use **a moving target left and right**",
      "many people follow **a moving target left and right**"
    )
    .replaceAll(
      "use **a moving target left and right**",
      "follow **a moving target left and right**"
    )
    .replaceAll("10 minutes of free BLS", "10 minutes of Free mode")
    .replaceAll("free BLS minutes", "Free mode minutes")
    .replaceAll("free BLS", "Free mode")
    .replaceAll("Free mode is BLS-only controls", "Free mode is the moving ball only")
    .replaceAll("free BLS-only", "Free mode (ball only)")
    .replaceAll("BLS-only", "the moving ball only")
    .replaceAll("BLS controls", "Session controls");
}

export function brandMetadataBase(): URL {
  const raw = process.env.APP_URL?.trim() || `https://${BRAND_DOMAIN}`;
  try {
    return new URL(raw);
  } catch {
    return new URL(`https://${BRAND_DOMAIN}`);
  }
}

import { BRAND_SPOKEN } from "@/lib/brand";
import { legalEntityDisplayName } from "@/lib/legal-entity";

export const SITE_CONTENT_LANGUAGE = "en";

/** Canonical + hreflang for the current (only) locale. Ready for more languages later. */
export function localeAlternates(canonical: string): {
  canonical: string;
  languages: Record<string, string>;
} {
  return {
    canonical,
    languages: {
      "x-default": canonical,
      [SITE_CONTENT_LANGUAGE]: canonical,
    },
  };
}

export type BreadcrumbItem = {
  name: string;
  path: string;
};

export function breadcrumbJsonLd(origin: string, items: BreadcrumbItem[]) {
  const base = origin.replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.path === "/" ? `${base}/` : `${base}${item.path}`,
    })),
  };
}

export function organizationJsonLd(origin: string) {
  const base = origin.replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND_SPOKEN,
    legalName: legalEntityDisplayName(),
    alternateName: legalEntityDisplayName(),
    url: `${base}/`,
    email: "hello@nurahelp.com",
    description:
      "Self-help software for guided EMDR practice and visual sets. Not a licensed therapist.",
  };
}

export function stringifyJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

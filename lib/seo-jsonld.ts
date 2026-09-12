import { BRAND_SPOKEN } from "@/lib/brand";
import {
  CLUSTER_TOPICS,
  clusterArticlesByTopic,
  listClusterArticles,
} from "@/lib/content-cluster";
import {
  CLINICAL_ADVISOR,
  hasClinicalAdvisorConfigured,
  legalEntityDisplayName,
} from "@/lib/legal-entity";

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

export type ItemListEntry = {
  name: string;
  path: string;
};

export function itemListJsonLd(origin: string, items: ItemListEntry[]) {
  const base = origin.replace(/\/$/, "");
  return {
    "@type": "ItemList",
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: `${base}${item.path}`,
    })),
  };
}

export function collectionPageJsonLd({
  origin,
  path,
  name,
  description,
  types = ["CollectionPage"],
  items,
}: {
  origin: string;
  path: string;
  name: string;
  description: string;
  types?: string[];
  items: ItemListEntry[];
}) {
  const base = origin.replace(/\/$/, "");
  const url = `${base}${path}`;
  return {
    "@type": types.length === 1 ? types[0] : types,
    "@id": `${url}#page`,
    url,
    name,
    description,
    inLanguage: SITE_CONTENT_LANGUAGE,
    isPartOf: {
      "@type": "WebSite",
      name: BRAND_SPOKEN,
      url: `${base}/`,
    },
    mainEntity: itemListJsonLd(origin, items),
  };
}

/** Visible H1 + dek on `/learn` — JSON-LD must match the hub, not the meta title. */
export const LEARN_JSON_LD = {
  name: "Start with one guide",
  description: "Pick a topic below. One guide is enough for now.",
} as const;

/** Visible H1 + dek on `/blog` (dek without the Learn link markup). */
export const BLOG_INDEX_JSON_LD = {
  name: "EMDR therapy, visual sets, and practice",
  description:
    "Guides for practice between sessions — newest first. New here? Learn is the short start map.",
} as const;

function articleListItems() {
  return listClusterArticles().map((article) => ({
    name: article.title,
    path: `/blog/${article.slug}`,
  }));
}

function learnListItems() {
  const groups = clusterArticlesByTopic();
  return CLUSTER_TOPICS.flatMap((topic) =>
    groups[topic].map((article) => ({
      name: article.title,
      path: `/blog/${article.slug}`,
    })),
  );
}

export function buildLearnJsonLd(origin: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationJsonLd(origin),
      collectionPageJsonLd({
        origin,
        path: "/learn",
        name: LEARN_JSON_LD.name,
        description: LEARN_JSON_LD.description,
        items: learnListItems(),
      }),
      breadcrumbJsonLd(origin, [
        { name: "Home", path: "/" },
        { name: "Learn", path: "/learn" },
      ]),
    ],
  };
}

export function buildBlogIndexJsonLd(origin: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationJsonLd(origin),
      collectionPageJsonLd({
        origin,
        path: "/blog",
        name: BLOG_INDEX_JSON_LD.name,
        description: BLOG_INDEX_JSON_LD.description,
        types: ["CollectionPage", "Blog"],
        items: articleListItems(),
      }),
      breadcrumbJsonLd(origin, [
        { name: "Home", path: "/" },
        { name: "Blog", path: "/blog" },
      ]),
    ],
  };
}

export type FaqItem = { q: string; a: string };

export function faqPageJsonLd(items: FaqItem[]) {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

/**
 * YMYL page node. Stays a plain `WebPage` until a named clinical reviewer is
 * set in `CLINICAL_ADVISOR`; then it upgrades to `MedicalWebPage` with
 * `reviewedBy` + `lastReviewed` (no invented credentials before that).
 */
export function reviewablePageJsonLd({
  origin,
  path,
  name,
  description,
}: {
  origin: string;
  path: string;
  name: string;
  description: string;
}) {
  const base = origin.replace(/\/$/, "");
  const url = `${base}${path}`;
  const reviewed = hasClinicalAdvisorConfigured();
  const node: Record<string, unknown> = {
    "@type": reviewed ? "MedicalWebPage" : "WebPage",
    "@id": `${url}#page`,
    url,
    name,
    description,
    inLanguage: SITE_CONTENT_LANGUAGE,
    isPartOf: { "@type": "WebSite", name: BRAND_SPOKEN, url: `${base}/` },
  };
  if (reviewed) {
    if (CLINICAL_ADVISOR.lastReviewedAt) {
      node.lastReviewed = CLINICAL_ADVISOR.lastReviewedAt;
    }
    node.reviewedBy = {
      "@type": "Person",
      name: CLINICAL_ADVISOR.name,
      ...(CLINICAL_ADVISOR.credentials
        ? { hasCredential: CLINICAL_ADVISOR.credentials }
        : {}),
    };
  }
  return node;
}

/** H1 + lead on `/emdr` — JSON-LD name/description mirror the page, not the meta. */
export const EMDR_JSON_LD = {
  name: "AI-guided EMDR therapy online",
  description:
    "A guided self-help tool for bilateral stimulation — visual, audio, and tactile sets with an AI that paces the session, prompts grounding, and closes it properly. Not therapy, and not a substitute for a clinician.",
} as const;

/** H1 + lead on `/safety`. */
export const SAFETY_JSON_LD = {
  name: "Using AI-guided EMDR safely",
  description:
    "When to stop a session, when to contact a clinician, and crisis lines to call if you are not safe. Nura is self-help software, not emergency care.",
} as const;

/** H1 + lead on `/limits`. */
export const LIMITS_JSON_LD = {
  name: "What Nura does not do",
  description:
    "The honest limits of AI-guided EMDR: no diagnosis, no treatment, no clinical judgment, no crisis care. What a tool can and cannot do on its own.",
} as const;

export function buildEmdrJsonLd(origin: string, faqItems: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationJsonLd(origin),
      reviewablePageJsonLd({
        origin,
        path: "/emdr",
        name: EMDR_JSON_LD.name,
        description: EMDR_JSON_LD.description,
      }),
      faqPageJsonLd(faqItems),
      breadcrumbJsonLd(origin, [
        { name: "Home", path: "/" },
        { name: "EMDR", path: "/emdr" },
      ]),
    ],
  };
}

export function buildSafetyJsonLd(origin: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationJsonLd(origin),
      reviewablePageJsonLd({
        origin,
        path: "/safety",
        name: SAFETY_JSON_LD.name,
        description: SAFETY_JSON_LD.description,
      }),
      breadcrumbJsonLd(origin, [
        { name: "Home", path: "/" },
        { name: "Safety", path: "/safety" },
      ]),
    ],
  };
}

export function buildLimitsJsonLd(origin: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationJsonLd(origin),
      reviewablePageJsonLd({
        origin,
        path: "/limits",
        name: LIMITS_JSON_LD.name,
        description: LIMITS_JSON_LD.description,
      }),
      breadcrumbJsonLd(origin, [
        { name: "Home", path: "/" },
        { name: "Limits", path: "/limits" },
      ]),
    ],
  };
}

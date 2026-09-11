import type { Metadata } from "next";
import {
  BRAND_DESCRIPTION,
  BRAND_DOMAIN,
  BRAND_LEGAL,
  BRAND_TITLE,
  brandMetadataBase,
} from "@/lib/brand";
import {
  isValidClarityId,
  isValidGa4Id,
  isValidGtmId,
  maskPublicId,
  type PlatformSeoConfig,
  type SeoPageId,
  SEO_PAGE_IDS,
  DEFAULT_PLATFORM_SEO,
} from "@/lib/seo-config";
import {
  maskIpForDisplay,
  parseAnalyticsIgnoreIps,
} from "@/lib/analytics-ignore";
import { getPlatformSettings, getPublicAppUrl } from "@/lib/platform-settings";

export type SiteSeoPage = {
  id: SeoPageId;
  path: string;
  label: string;
  title: string;
  description: string;
  ogTitle: string;
  ogImageUrl: string;
  canonical: string;
  indexable: boolean;
};

type PageDefault = {
  id: SeoPageId;
  path: string;
  label: string;
  title: string;
  description: string;
};

export const SITE_SEO_DEFAULTS: PageDefault[] = [
  {
    id: "home",
    path: "/",
    label: "Home",
    title: BRAND_TITLE,
    description: BRAND_DESCRIPTION,
  },
  {
    id: "about",
    path: "/about",
    label: "About",
    title: "About",
    description: BRAND_DESCRIPTION,
  },
  {
    id: "emdr",
    path: "/emdr",
    label: "EMDR",
    title: "EMDR Support",
    description:
      "What EMDR is, how visual sets work, and how a Nura session is structured.",
  },
  {
    id: "resources",
    path: "/resources",
    label: "Resources",
    title: "Resources",
    description: "Guides for EMDR and therapy support on Nura.",
  },
  {
    id: "privacy",
    path: "/privacy",
    label: "Privacy",
    title: "Privacy",
    description: `Privacy policy for ${BRAND_LEGAL}`,
  },
  {
    id: "terms",
    path: "/terms",
    label: "Terms",
    title: "Terms",
    description: `Terms of service for ${BRAND_LEGAL}`,
  },
];

export function isSeoPageId(value: string): value is SeoPageId {
  return (SEO_PAGE_IDS as readonly string[]).includes(value);
}

export function siteOrigin(publicAppUrl?: string): string {
  const raw = (publicAppUrl || "").trim() || brandMetadataBase().origin;
  try {
    return new URL(raw).origin;
  } catch {
    return `https://${BRAND_DOMAIN}`;
  }
}

export function resolveSiteSeoPages(
  seo: PlatformSeoConfig,
  publicAppUrl?: string
): SiteSeoPage[] {
  const origin = siteOrigin(publicAppUrl);
  const defaultOg = `${origin}/brand/lockup.png`;
  return SITE_SEO_DEFAULTS.map((def) => {
    const o = seo.pages[def.id];
    const title = o?.title?.trim() || def.title;
    const description = o?.description?.trim() || def.description;
    const ogTitle = o?.ogTitle?.trim() || title;
    const ogImageUrl = o?.ogImageUrl?.trim() || defaultOg;
    const path = def.path;
    const canonical = path === "/" ? `${origin}/` : `${origin}${path}`;
    return {
      id: def.id,
      path,
      label: def.label,
      title,
      description,
      ogTitle,
      ogImageUrl,
      canonical,
      indexable: true,
    };
  });
}

export async function getResolvedSiteSeoPages(): Promise<{
  pages: SiteSeoPage[];
  seo: PlatformSeoConfig;
  publicAppUrl: string;
}> {
  const [settings, url] = await Promise.all([
    getPlatformSettings(),
    getPublicAppUrl(),
  ]);
  return {
    pages: resolveSiteSeoPages(settings.seo, url),
    seo: settings.seo,
    publicAppUrl: url,
  };
}

export async function buildPageMetadata(pageId: SeoPageId): Promise<Metadata> {
  let pages: SiteSeoPage[];
  let seo: PlatformSeoConfig = DEFAULT_PLATFORM_SEO;
  try {
    const resolved = await getResolvedSiteSeoPages();
    pages = resolved.pages;
    seo = resolved.seo;
  } catch {
    // Docker/CI builds have no DATABASE_URL — use static defaults.
    pages = resolveSiteSeoPages(DEFAULT_PLATFORM_SEO);
  }
  const page = pages.find((p) => p.id === pageId) ?? pages[0];
  const verification: Metadata["verification"] = {};
  if (seo.gscVerification.trim()) {
    verification.google = seo.gscVerification.trim();
  }
  if (seo.bingVerification.trim()) {
    verification.other = {
      "msvalidate.01": seo.bingVerification.trim(),
    };
  }
  return {
    title: { absolute: page.title },
    description: page.description,
    alternates: { canonical: page.canonical },
    openGraph: {
      title: page.ogTitle,
      description: page.description,
      url: page.canonical,
      siteName: BRAND_LEGAL,
      type: "website",
      images: [{ url: page.ogImageUrl }],
    },
    ...(Object.keys(verification).length ? { verification } : {}),
  };
}

export type ConnectionStatus =
  | "connected"
  | "not_connected"
  | "via_tag_manager";

export type SeoConnection = {
  id: string;
  name: string;
  status: ConnectionStatus;
  publicIdMasked: string | null;
  detail: string | null;
  hint: string;
};

export type MarketingSeoStatus = {
  siteUrl: string;
  title: string;
  description: string;
  canonical: string;
  ogTitle: string;
  ogImageUrl: string;
  sitemapUrl: string;
  robotsUrl: string;
  gscProperty: string | null;
  sitemapNote: string;
  connections: SeoConnection[];
};

export function buildMarketingSeoStatus(
  seo: PlatformSeoConfig,
  pages: SiteSeoPage[],
  publicAppUrl?: string
): MarketingSeoStatus {
  const origin = siteOrigin(publicAppUrl);
  const home = pages.find((p) => p.id === "home") ?? pages[0];
  const ga4 = seo.ga4MeasurementId.trim();
  const gtm = seo.gtmId.trim();
  const clarity = seo.clarityId.trim();
  const gscProp = seo.gscProperty.trim();
  const gscVer = seo.gscVerification.trim();
  const bing = seo.bingVerification.trim();
  const ignoreList = parseAnalyticsIgnoreIps(seo.ignoreIps);
  const gtmOn = isValidGtmId(gtm);
  const ga4On = isValidGa4Id(ga4);
  const clarityOn = isValidClarityId(clarity);
  const gscOn = Boolean(gscProp || gscVer);
  const bingOn = Boolean(bing);
  const ignoreOn = ignoreList.length > 0;

  const connections: SeoConnection[] = [
    {
      id: "gsc",
      name: "Google Search Console",
      status: gscOn ? "connected" : "not_connected",
      publicIdMasked: null,
      detail: gscProp || null,
      hint: gscOn
        ? "This domain is verified. Submit the sitemap in Search Console if you have not yet."
        : "Paste the verification code and property from Search Console.",
    },
    {
      id: "ignore_ips",
      name: "Ignored IPs",
      status: ignoreOn ? "connected" : "not_connected",
      publicIdMasked: null,
      detail: ignoreOn ? maskIpForDisplay(ignoreList[0]!) : null,
      hint: "Visits from these addresses do not load Analytics, Clarity, or Tag Manager. Past numbers in the Analytics tab may still include older clicks.",
    },
    {
      id: "clarity",
      name: "Microsoft Clarity",
      status: clarityOn ? "connected" : "not_connected",
      publicIdMasked: clarityOn ? maskPublicId(clarity) : null,
      detail: null,
      hint: "Loads on the homepage and legal pages after someone allows analytics cookies. Never on sign-in or the logged-in app.",
    },
    {
      id: "ga4",
      name: "Google Analytics",
      status: ga4On ? "connected" : "not_connected",
      publicIdMasked: ga4On ? maskPublicId(ga4) : null,
      detail: null,
      hint: "Loads on the homepage and legal pages after someone allows analytics cookies. Visit numbers live on the Analytics tab. Do not also add this ID in Tag Manager.",
    },
    {
      id: "gtm",
      name: "Google Tag Manager",
      status: gtmOn ? "connected" : "not_connected",
      publicIdMasked: gtmOn ? maskPublicId(gtm) : null,
      detail: null,
      hint: "Loads on the homepage and legal pages only. Do not add Google Analytics or Clarity tags in this container — Nura already loads them. Use Tag Manager only for Meta and LinkedIn later.",
    },
    {
      id: "bing",
      name: "Bing Webmaster Tools",
      status: bingOn ? "connected" : "not_connected",
      publicIdMasked: null,
      detail: null,
      hint: "Paste the verification code from Bing Webmaster Tools.",
    },
    {
      id: "meta",
      name: "Meta Pixel",
      status: gtmOn ? "via_tag_manager" : "not_connected",
      publicIdMasked: null,
      detail: null,
      hint: "Add the Meta Pixel inside Google Tag Manager. Nura does not load a separate Meta script.",
    },
    {
      id: "linkedin",
      name: "LinkedIn Insight",
      status: gtmOn ? "via_tag_manager" : "not_connected",
      publicIdMasked: null,
      detail: null,
      hint: "Add the LinkedIn tag inside Google Tag Manager. Nura does not load a separate LinkedIn script.",
    },
  ];

  return {
    siteUrl: origin,
    title: home.title,
    description: home.description,
    canonical: home.canonical,
    ogTitle: home.ogTitle,
    ogImageUrl: home.ogImageUrl,
    sitemapUrl: `${origin}/sitemap.xml`,
    robotsUrl: `${origin}/robots.txt`,
    gscProperty: gscProp || null,
    sitemapNote: gscOn
      ? "Submitted in Search Console when you add it there — Google can take a few days to process it."
      : "Connect Search Console, then submit this sitemap URL.",
    connections,
  };
}

/** Public tag IDs safe to expose to the marketing shell (not verification secrets). */
export type PublicMarketingTags = {
  ga4MeasurementId: string;
  gtmId: string;
  clarityId: string;
  skipAnalytics: boolean;
};

export function publicMarketingTags(
  seo: PlatformSeoConfig,
  skipAnalytics: boolean
): PublicMarketingTags {
  return {
    ga4MeasurementId: isValidGa4Id(seo.ga4MeasurementId)
      ? seo.ga4MeasurementId.trim()
      : "",
    gtmId: isValidGtmId(seo.gtmId) ? seo.gtmId.trim() : "",
    clarityId: isValidClarityId(seo.clarityId) ? seo.clarityId.trim() : "",
    skipAnalytics,
  };
}

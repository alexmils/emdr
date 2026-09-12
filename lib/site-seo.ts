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
import { localeAlternates } from "@/lib/seo-jsonld";
import { absoluteOgImageUrl } from "@/lib/seo-og-image";
import type {
  MarketingSeoStatus,
  PublicMarketingTags,
  SeoConnection,
  SiteSeoPage,
} from "@/lib/site-seo-types";

export type {
  ConnectionStatus,
  MarketingSeoStatus,
  PublicMarketingTags,
  SeoConnection,
  SiteSeoPage,
} from "@/lib/site-seo-types";
export { absoluteOgImageUrl, displayOgImageUrl } from "@/lib/seo-og-image";

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
    id: "editorial",
    path: "/editorial",
    label: "Editorial",
    title: "How we write these guides",
    description:
      "Nura public guides are self-help explainers about visual sets and practice. Not signed by a licensed EMDR clinician.",
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
    description:
      "Public guides on EMDR therapy, visual sets with a moving ball, and practice between sessions.",
  },
  {
    id: "blog",
    path: "/blog",
    label: "Blog",
    title: "EMDR therapy online — guides and visual sets",
    description:
      "Articles on EMDR therapy, visual sets with a moving ball, and practice between sessions. Self-help, not a licensed therapist.",
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
  const builtInDefault = `${origin}/brand/lockup.png`;
  const siteDefault = seo.defaultOgImageUrl.trim();
  return SITE_SEO_DEFAULTS.map((def) => {
    const o = seo.pages[def.id];
    const title = o?.title?.trim() || def.title;
    const description = o?.description?.trim() || def.description;
    const ogTitle = o?.ogTitle?.trim() || title;
    const pageOg = o?.ogImageUrl?.trim() || "";
    const stored = pageOg || siteDefault;
    const ogImageUrl = absoluteOgImageUrl({
      stored,
      origin,
      pageId: def.id,
      hasPageOverride: Boolean(pageOg),
      fallback: builtInDefault,
    });
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

export function metadataFromResolved(
  pageId: SeoPageId,
  pages: SiteSeoPage[],
  seo: PlatformSeoConfig = DEFAULT_PLATFORM_SEO
): Metadata {
  const page =
    pages.find((p) => p.id === pageId) ??
    resolveSiteSeoPages(seo).find((p) => p.id === pageId) ??
    pages[0];
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
    alternates: localeAlternates(page.canonical),
    openGraph: {
      title: page.ogTitle,
      description: page.description,
      url: page.canonical,
      siteName: BRAND_LEGAL,
      type: "website",
      locale: "en",
      images: [{ url: page.ogImageUrl }],
    },
    ...(Object.keys(verification).length ? { verification } : {}),
  };
}

export async function buildPageMetadata(pageId: SeoPageId): Promise<Metadata> {
  try {
    const resolved = await getResolvedSiteSeoPages();
    return metadataFromResolved(pageId, resolved.pages, resolved.seo);
  } catch {
    // Docker/CI builds have no DATABASE_URL — use static defaults.
    return metadataFromResolved(
      pageId,
      resolveSiteSeoPages(DEFAULT_PLATFORM_SEO)
    );
  }
}

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
      hint: "Tag loads on the homepage and legal pages with Consent Mode (storage stays off until analytics cookies are allowed). Visit numbers live on the Analytics tab. Do not also add this ID in Tag Manager.",
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
    llmsTxtUrl: `${origin}/llms.txt`,
    gscProperty: gscProp || null,
    sitemapNote: gscOn
      ? "Submitted in Search Console when you add it there — Google can take a few days to process it."
      : "Connect Search Console, then submit this sitemap URL.",
    connections,
  };
}

export function publicMarketingTags(
  seo: PlatformSeoConfig,
  skipAnalytics: boolean
): PublicMarketingTags {
  const ignoreList = parseAnalyticsIgnoreIps(seo.ignoreIps);
  return {
    ga4MeasurementId: isValidGa4Id(seo.ga4MeasurementId)
      ? seo.ga4MeasurementId.trim()
      : "",
    gtmId: isValidGtmId(seo.gtmId) ? seo.gtmId.trim() : "",
    clarityId: isValidClarityId(seo.clarityId) ? seo.clarityId.trim() : "",
    skipAnalytics,
    checkIgnoreIps: ignoreList.length > 0 && !skipAnalytics,
  };
}

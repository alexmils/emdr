import {
  BRAND_DESCRIPTION,
  BRAND_DOMAIN,
  BRAND_PRODUCT,
  BRAND_SOCIAL,
  BRAND_SPOKEN,
  brandMetadataBase,
} from "@/lib/brand";
import { legalEntityDisplayName } from "@/lib/legal-entity";
import { LANDING_FAQ_ITEMS } from "@/lib/landing-faq";
import {
  BILLING_PLANS,
} from "@/lib/billing-constants";

function jsonLdOrigin(): string {
  try {
    return brandMetadataBase().origin;
  } catch {
    return `https://${BRAND_DOMAIN}`;
  }
}

function euroAmount(displayPrice: string): string {
  const n = displayPrice.replace(/[^\d.]/g, "");
  if (!n) return "0";
  return n.includes(".") ? n : `${n}.00`;
}

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function buildHomeJsonLd(origin = jsonLdOrigin()) {
  const orgId = `${origin}/#organization`;
  const appId = `${origin}/#app`;
  const faqId = `${origin}/#faq`;
  const logoUrl = `${origin}/brand/lockup.png`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": orgId,
        name: BRAND_SPOKEN,
        legalName: legalEntityDisplayName(),
        alternateName: legalEntityDisplayName(),
        url: `${origin}/`,
        logo: {
          "@type": "ImageObject",
          url: logoUrl,
        },
        description: BRAND_DESCRIPTION,
        sameAs: [BRAND_SOCIAL.instagram, BRAND_SOCIAL.facebook],
      },
      {
        "@type": "SoftwareApplication",
        "@id": appId,
        name: BRAND_SPOKEN,
        alternateName: BRAND_PRODUCT,
        applicationCategory: "HealthApplication",
        operatingSystem: "Web",
        url: `${origin}/`,
        description: BRAND_DESCRIPTION,
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "EUR",
          lowPrice: euroAmount(BILLING_PLANS.weekly.displayPrice),
          highPrice: euroAmount(BILLING_PLANS.yearly.displayPrice),
          offerCount: 3,
          url: `${origin}/#prices`,
        },
        publisher: { "@id": orgId },
      },
      {
        "@type": "FAQPage",
        "@id": faqId,
        url: `${origin}/#faq`,
        inLanguage: "en",
        mainEntity: LANDING_FAQ_ITEMS.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
        publisher: { "@id": orgId },
      },
    ],
  };
}

import { FrontendShell } from "@/app/components/frontend/FrontendShell";
import { FaqPageView } from "@/app/components/frontend/FaqPageView";
import { JsonLd } from "@/app/components/frontend/JsonLd";
import { getPublicAppUrl } from "@/lib/platform-settings";
import { PUBLIC_FAQ_ITEMS } from "@/lib/public-faq";
import { buildPublicFaqJsonLd } from "@/lib/seo-jsonld";
import { buildCachedPageMetadata } from "@/lib/site-seo-cache";
import { siteOrigin } from "@/lib/site-seo";
import type { Metadata } from "next";

export const revalidate = 3600; // PUBLIC_PAGE_REVALIDATE_SECONDS

export async function generateMetadata(): Promise<Metadata> {
  return buildCachedPageMetadata("faq");
}

export default async function FaqPage() {
  let publicUrl: string | undefined;
  try {
    publicUrl = await getPublicAppUrl();
  } catch {
    publicUrl = undefined;
  }
  const origin = siteOrigin(publicUrl);

  return (
    <FrontendShell>
      <JsonLd data={buildPublicFaqJsonLd(origin, [...PUBLIC_FAQ_ITEMS])} />
      <FaqPageView />
    </FrontendShell>
  );
}

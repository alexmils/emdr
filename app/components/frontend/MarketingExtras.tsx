import { CookieBanner } from "@/app/components/frontend/CookieBanner";
import { MarketingTags } from "@/app/components/frontend/MarketingTags";
import { DEFAULT_PLATFORM_SEO } from "@/lib/seo-config";
import { getCachedResolvedSiteSeoPages } from "@/lib/site-seo-cache";
import { publicMarketingTags } from "@/lib/site-seo";

/** Server-only: consent banner + GA/Clarity/GTM for public marketing pages. */
export async function MarketingExtras() {
  let seo = DEFAULT_PLATFORM_SEO;
  try {
    const resolved = await getCachedResolvedSiteSeoPages();
    seo = resolved.seo;
  } catch {
    // Build-time / DB unavailable
  }
  const tags = publicMarketingTags(seo, false);
  return (
    <>
      <MarketingTags tags={tags} />
      <CookieBanner />
    </>
  );
}

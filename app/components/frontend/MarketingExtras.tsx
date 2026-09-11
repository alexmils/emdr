import { headers } from "next/headers";
import { shouldSkipMarketingAnalytics } from "@/lib/analytics-ignore";
import { getPlatformSettings } from "@/lib/platform-settings";
import { publicMarketingTags } from "@/lib/site-seo";
import { CookieBanner } from "@/app/components/frontend/CookieBanner";
import { MarketingTags } from "@/app/components/frontend/MarketingTags";

/** Server-only: consent banner + GA/Clarity/GTM for public marketing pages. */
export async function MarketingExtras() {
  const [settings, h] = await Promise.all([
    getPlatformSettings(),
    headers(),
  ]);
  const skip = shouldSkipMarketingAnalytics(h, settings.seo.ignoreIps);
  const tags = publicMarketingTags(settings.seo, skip);
  return (
    <>
      <MarketingTags tags={tags} />
      <CookieBanner />
    </>
  );
}

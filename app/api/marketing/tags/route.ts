import { NextResponse } from "next/server";
import { getPlatformSettings } from "@/lib/platform-settings";
import { DEFAULT_PLATFORM_SEO } from "@/lib/seo-config";
import { publicMarketingTags } from "@/lib/site-seo";
import { revalidatePublicSeo } from "@/lib/site-seo-cache";

export const dynamic = "force-dynamic";

let healedEmptyIsr = false;

/**
 * Live GA4 / GTM / Clarity IDs for marketing pages. Public HTML is ISR-cached
 * (often built without DB), so the client must load tag IDs from here.
 * First successful read also revalidates public paths so crawlers eventually
 * see IDs in the HTML payload too.
 */
export async function GET() {
  try {
    const settings = await getPlatformSettings();
    const tags = publicMarketingTags(settings.seo, false);
    if (
      !healedEmptyIsr &&
      (tags.ga4MeasurementId || tags.gtmId || tags.clarityId)
    ) {
      healedEmptyIsr = true;
      try {
        revalidatePublicSeo();
      } catch {
        healedEmptyIsr = false;
      }
    }
    return NextResponse.json(tags, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json(publicMarketingTags(DEFAULT_PLATFORM_SEO, false), {
      status: 200,
      headers: { "Cache-Control": "private, no-store" },
    });
  }
}

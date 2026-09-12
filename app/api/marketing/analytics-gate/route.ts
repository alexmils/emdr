import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { shouldSkipMarketingAnalytics } from "@/lib/analytics-ignore";
import { getPlatformSettings } from "@/lib/platform-settings";

export const dynamic = "force-dynamic";

/**
 * Per-request ignore-IP check. Public marketing HTML is ISR-cached, so this
 * must not run in the page render — only from the client before tags load.
 */
export async function GET() {
  try {
    const [settings, h] = await Promise.all([
      getPlatformSettings(),
      headers(),
    ]);
    const skip = shouldSkipMarketingAnalytics(h, settings.seo.ignoreIps);
    return NextResponse.json(
      { skip },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch {
    return NextResponse.json(
      { skip: false },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  }
}

import { NextResponse } from "next/server";
import { requireAdminAccess, isAuthContext } from "@/lib/api-auth";
import { getPlatformSettings } from "@/lib/platform-settings";
import { fetchSiteAnalytics } from "@/lib/site-analytics";

export async function GET(request: Request) {
  const auth = await requireAdminAccess();
  if (!isAuthContext(auth)) return auth;

  try {
    const range = new URL(request.url).searchParams.get("range");
    const settings = await getPlatformSettings();
    const analytics = await fetchSiteAnalytics(settings.seo, range);
    return NextResponse.json({ analytics });
  } catch (err) {
    console.error("[admin/seo/analytics]", err);
    return NextResponse.json(
      { error: "Failed to load site analytics" },
      { status: 500 }
    );
  }
}

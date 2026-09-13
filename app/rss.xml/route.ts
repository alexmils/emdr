import { NextResponse } from "next/server";
import { getPublicAppUrl } from "@/lib/platform-settings";
import { siteOrigin } from "@/lib/site-seo";

/** Conventional feed path → canonical `/feed.xml` on the public origin. */
export async function GET() {
  let publicUrl: string | undefined;
  try {
    publicUrl = await getPublicAppUrl();
  } catch {
    publicUrl = undefined;
  }
  const origin = siteOrigin(publicUrl);
  return NextResponse.redirect(new URL("/feed.xml", origin), 301);
}

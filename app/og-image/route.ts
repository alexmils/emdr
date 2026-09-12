import { NextResponse } from "next/server";
import {
  isSeoPageId,
  parseOgImageDataUrl,
  type SeoPageId,
} from "@/lib/seo-config";
import { getPlatformSettings, getPublicAppUrl } from "@/lib/platform-settings";
import { siteOrigin } from "@/lib/site-seo";

export const dynamic = "force-dynamic";

/**
 * Public Open Graph image for crawlers.
 * Query: `?scope=default` | `?page=home` (etc.)
 * Serves stored data URLs; otherwise redirects to https/path/built-in lockup.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const pageParam = url.searchParams.get("page");
  const scope = (url.searchParams.get("scope") || "").trim().toLowerCase();

  let settings;
  let publicAppUrl: string;
  try {
    [settings, publicAppUrl] = await Promise.all([
      getPlatformSettings(),
      getPublicAppUrl(),
    ]);
  } catch (err) {
    console.error("[og-image]", err);
    return NextResponse.redirect(new URL("/brand/lockup.png", request.url));
  }

  const origin = siteOrigin(publicAppUrl);
  const seo = settings.seo;
  let stored = "";

  if (pageParam && isSeoPageId(pageParam)) {
    const pageId = pageParam as SeoPageId;
    stored =
      seo.pages[pageId]?.ogImageUrl?.trim() ||
      seo.defaultOgImageUrl.trim() ||
      "";
  } else if (scope === "default" || !pageParam) {
    stored = seo.defaultOgImageUrl.trim();
  }

  if (!stored) {
    return NextResponse.redirect(`${origin}/brand/lockup.png`);
  }

  if (stored.startsWith("data:image/")) {
    const parsed = parseOgImageDataUrl(stored);
    if (!parsed) {
      return NextResponse.redirect(`${origin}/brand/lockup.png`);
    }
    return new NextResponse(new Uint8Array(parsed.body), {
      status: 200,
      headers: {
        "Content-Type": parsed.contentType,
        "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
      },
    });
  }

  if (stored.startsWith("/")) {
    return NextResponse.redirect(`${origin}${stored}`);
  }

  if (/^https:\/\//i.test(stored)) {
    return NextResponse.redirect(stored);
  }

  return NextResponse.redirect(`${origin}/brand/lockup.png`);
}

import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseBrandAssetDataUrl } from "@/lib/brand-assets";
import { getPlatformSettings } from "@/lib/platform-settings";

export const dynamic = "force-dynamic";

async function fallbackIcon(request: Request): Promise<NextResponse> {
  try {
    const file = path.join(process.cwd(), "app", "icon.png");
    const body = await readFile(file);
    return new NextResponse(body, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
      },
    });
  } catch {
    return NextResponse.redirect(new URL("/icon.png", request.url));
  }
}

/** Public favicon — custom platform asset or built-in icon.png. */
export async function GET(request: Request) {
  try {
    const settings = await getPlatformSettings();
    const stored = settings.faviconUrl.trim();
    if (stored.startsWith("data:image/")) {
      const parsed = parseBrandAssetDataUrl(stored);
      if (parsed) {
        return new NextResponse(new Uint8Array(parsed.body), {
          headers: {
            "Content-Type": parsed.contentType,
            "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
          },
        });
      }
    }
    if (stored.startsWith("/")) {
      return NextResponse.redirect(new URL(stored, request.url));
    }
    if (/^https:\/\//i.test(stored)) {
      return NextResponse.redirect(stored);
    }
    return fallbackIcon(request);
  } catch (err) {
    console.error("[brand-assets/favicon]", err);
    return fallbackIcon(request);
  }
}

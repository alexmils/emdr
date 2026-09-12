import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  DEFAULT_APP_LOGO_PATH,
  parseBrandAssetDataUrl,
} from "@/lib/brand-assets";
import { getPlatformSettings } from "@/lib/platform-settings";

export const dynamic = "force-dynamic";

async function fallbackLogo(request: Request): Promise<NextResponse> {
  try {
    const file = path.join(
      process.cwd(),
      "public",
      "brand",
      "nura-wave-logo-white.png"
    );
    const body = await readFile(file);
    return new NextResponse(body, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
      },
    });
  } catch {
    return NextResponse.redirect(new URL(DEFAULT_APP_LOGO_PATH, request.url));
  }
}

/** Public /app sidebar logo — custom platform asset or white wave lockup. */
export async function GET(request: Request) {
  try {
    const settings = await getPlatformSettings();
    const stored = settings.appLogoUrl.trim();
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
    return fallbackLogo(request);
  } catch (err) {
    console.error("[brand-assets/app-logo]", err);
    return fallbackLogo(request);
  }
}

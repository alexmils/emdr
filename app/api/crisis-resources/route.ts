import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-auth";
import { resourcesForCountry } from "@/lib/emergency-by-country";
import { resolveRequestCountry } from "@/lib/geo-country";

/**
 * Localized emergency + crisis numbers from request geo
 * (Cloudflare CF-IPCountry, else IP lookup).
 */
export async function GET(request: Request) {
  return withAuth(async () => {
    const geo = await resolveRequestCountry(request);
    const resources = resourcesForCountry(geo.countryCode);
    return NextResponse.json({
      ...resources,
      source: geo.source,
    });
  });
}

import { NextResponse } from "next/server";
import { NOINDEX_ROBOTS } from "@/lib/crawl-headers";
import { buildPublicHealth } from "@/lib/health";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  "X-Robots-Tag": NOINDEX_ROBOTS,
};

export async function GET() {
  const payload = await buildPublicHealth();
  return NextResponse.json(payload, {
    status: payload.ok ? 200 : 503,
    headers: HEADERS,
  });
}

export async function HEAD() {
  const payload = await buildPublicHealth();
  return new NextResponse(null, {
    status: payload.ok ? 200 : 503,
    headers: HEADERS,
  });
}

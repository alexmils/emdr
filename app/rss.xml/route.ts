import { NextRequest, NextResponse } from "next/server";

/** Conventional feed path → canonical `/feed.xml`. */
export function GET(req: NextRequest) {
  return NextResponse.redirect(new URL("/feed.xml", req.url), 301);
}

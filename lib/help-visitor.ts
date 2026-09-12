import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import {
  HELP_VISITOR_COOKIE,
  HELP_VISITOR_MAX_AGE_SEC,
  isValidVisitorKey,
} from "@/lib/help-visitor-core";

export * from "@/lib/help-visitor-core";

export async function readVisitorKeyFromCookies(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(HELP_VISITOR_COOKIE)?.value;
  return isValidVisitorKey(raw) ? raw : null;
}

export function applyVisitorCookie(
  response: NextResponse,
  visitorKey: string
): void {
  const secure =
    process.env.NODE_ENV === "production" ||
    process.env.APP_URL?.startsWith("https://") === true;
  response.cookies.set(HELP_VISITOR_COOKIE, visitorKey, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: HELP_VISITOR_MAX_AGE_SEC,
  });
}

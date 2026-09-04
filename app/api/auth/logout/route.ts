import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { clearSessionCookieOptions, getSession } from "@/lib/auth/session";
import { ROLE_SYNC_COOKIE } from "@/lib/auth/role-sync";
import { clientIp, writeAuditEvent } from "@/lib/audit-log";

export async function POST(request: Request) {
  const session = await getSession();
  if (session) {
    await writeAuditEvent({
      actorUserId: session.sub,
      targetUserId: session.sub,
      action: "user.logout",
      ip: clientIp(request),
    });
  }

  const jar = await cookies();
  jar.set(clearSessionCookieOptions());
  jar.set({
    name: ROLE_SYNC_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return NextResponse.json({ ok: true });
}

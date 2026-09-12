import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { clientIp, writeAuditEvent } from "@/lib/audit-log";
import { ROLE_SYNC_COOKIE } from "@/lib/auth/role-sync";
import {
  clearSessionCookieOptions,
  getSession,
} from "@/lib/auth/session";
import { resolveSessionUser } from "@/lib/auth/refresh-session";
import {
  deleteOwnAccount,
  emailsMatchForDeletion,
} from "@/lib/delete-account";
import { sendAccountDeletedEmails } from "@/lib/account-deleted-emails";
import { getUserById } from "@/lib/users";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolved = await resolveSessionUser(session);
  if (!resolved) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { confirmEmail?: unknown };
  try {
    body = (await request.json()) as { confirmEmail?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.confirmEmail !== "string" || !body.confirmEmail.trim()) {
    return NextResponse.json(
      { error: "Type your account email to confirm" },
      { status: 400 }
    );
  }

  const user = await getUserById(resolved.userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!emailsMatchForDeletion(body.confirmEmail, user.email)) {
    return NextResponse.json(
      { error: "Email does not match this account" },
      { status: 400 }
    );
  }

  const ip = clientIp(request);
  const deletedEmail = user.email;
  const deletedName = user.name;

  await writeAuditEvent({
    actorUserId: user.id,
    targetUserId: user.id,
    action: "user.deleted",
    detail: {
      self: true,
      email: deletedEmail,
    },
    ip,
  });

  const result = await deleteOwnAccount(user.id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await sendAccountDeletedEmails({
    email: deletedEmail,
    name: deletedName,
    stripeCanceled: result.stripe.canceled,
  });

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

  return NextResponse.json({
    ok: true,
    stripeCanceled: result.stripe.canceled,
  });
}

import { NextResponse } from "next/server";
import {
  requirePlatformAdminWrite,
  isAuthContext,
} from "@/lib/api-auth";
import { createAuthToken } from "@/lib/auth/tokens";
import { getAppUrl, sendTemplateEmail } from "@/lib/email";
import { getUserById } from "@/lib/users";
import { clientIp, writeAuditEvent } from "@/lib/audit-log";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePlatformAdminWrite();
  if (!isAuthContext(auth)) return auth;

  const { id } = await params;
  try {
    const user = await getUserById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (user.passwordHash) {
      return NextResponse.json(
        { error: "User already has a password" },
        { status: 400 }
      );
    }

    const raw = await createAuthToken(user.id, "invite");
    const createPasswordUrl = `${await getAppUrl(
      `/create-password?token=${encodeURIComponent(raw)}`
    )}`;

    await sendTemplateEmail(user.email, "welcome_invite", {
      name: user.name ?? user.email.split("@")[0],
      createPasswordUrl,
      expiresIn: "72 hours",
    });

    await writeAuditEvent({
      actorUserId: auth.user.id,
      targetUserId: user.id,
      action: "user.invited",
      detail: { email: user.email, resent: true },
      ip: clientIp(_request),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/users/resend-invite]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Resend failed" },
      { status: 503 }
    );
  }
}

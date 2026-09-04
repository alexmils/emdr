import { NextResponse } from "next/server";
import {
  requirePlatformSettingsAccess,
  isAuthContext,
} from "@/lib/api-auth";
import { ensureSchemaReady, getPool } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { getPlatformSettings } from "@/lib/platform-settings";
import { clientIp, writeAuditEvent } from "@/lib/audit-log";

export async function POST(request: Request) {
  const auth = await requirePlatformSettingsAccess();
  if (!isAuthContext(auth)) return auth;

  try {
    const { subject, html, text } = (await request.json()) as {
      subject?: string;
      html?: string;
      text?: string;
    };

    if (!subject?.trim() || !html || !text) {
      return NextResponse.json(
        { error: "subject, html, and text are required" },
        { status: 400 }
      );
    }

    await ensureSchemaReady();
    const platform = await getPlatformSettings();
    const { rows } = await getPool().query<{ email: string }>(
      "SELECT email FROM users WHERE status = 'active'"
    );

    let sent = 0;
    for (const row of rows) {
      try {
        await sendEmail({
          to: row.email,
          subject: subject.trim(),
          html,
          text,
          templateId: "broadcast",
        });
        sent++;
      } catch (err) {
        console.warn("[broadcast] failed for", row.email, err);
      }
    }

    await writeAuditEvent({
      actorUserId: auth.user.id,
      action: "email.broadcast_sent",
      detail: { subject: subject.trim(), recipients: sent, siteName: platform.siteName },
      ip: clientIp(request),
    });

    return NextResponse.json({ ok: true, sent });
  } catch (err) {
    console.error("[admin/email/broadcast]", err);
    return NextResponse.json({ error: "Broadcast failed" }, { status: 500 });
  }
}

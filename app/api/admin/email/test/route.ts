import { NextResponse } from "next/server";
import {
  requirePlatformSettingsAccess,
  isAuthContext,
} from "@/lib/api-auth";
import { getAppUrl, sendTemplateEmail } from "@/lib/email";
import type { EmailTemplateId } from "@/lib/email/templates";
import { clientIp, writeAuditEvent } from "@/lib/audit-log";

const VALID: EmailTemplateId[] = [
  "password_reset",
  "welcome_invite",
  "password_changed",
  "welcome",
];

export async function POST(request: Request) {
  const auth = await requirePlatformSettingsAccess();
  if (!isAuthContext(auth)) return auth;

  try {
    const { to, templateId } = (await request.json()) as {
      to?: string;
      templateId?: EmailTemplateId;
    };

    if (!to?.trim()) {
      return NextResponse.json({ error: "Recipient is required" }, { status: 400 });
    }

    const id = templateId && VALID.includes(templateId) ? templateId : "welcome";
    const sample = {
      name: "Test User",
      resetUrl: await getAppUrl("/reset-password?token=test"),
      createPasswordUrl: await getAppUrl("/create-password?token=test"),
      loginUrl: await getAppUrl("/login"),
      expiresIn: "72 hours",
    };

    if (id === "password_reset") {
      await sendTemplateEmail(to.trim(), id, {
        name: sample.name,
        resetUrl: sample.resetUrl,
        expiresIn: sample.expiresIn,
      });
    } else if (id === "welcome_invite") {
      await sendTemplateEmail(to.trim(), id, {
        name: sample.name,
        createPasswordUrl: sample.createPasswordUrl,
        expiresIn: sample.expiresIn,
      });
    } else if (id === "password_changed") {
      await sendTemplateEmail(to.trim(), id, {
        name: sample.name,
        loginUrl: sample.loginUrl,
      });
    } else {
      await sendTemplateEmail(to.trim(), "welcome", {
        name: sample.name,
        loginUrl: sample.loginUrl,
      });
    }

    await writeAuditEvent({
      actorUserId: auth.user.id,
      action: "email.test_sent",
      detail: { to: to.trim(), templateId: id },
      ip: clientIp(request),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/email/test]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Send failed" },
      { status: 503 }
    );
  }
}

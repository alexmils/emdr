import { getPool } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { getPlatformSettings } from "@/lib/platform-settings";

export async function notifyAdminsOfHelpMessage(input: {
  fromLabel: string;
  preview: string;
  threadId: string;
}): Promise<void> {
  const platform = await getPlatformSettings();
  const { rows } = await getPool().query<{ email: string }>(
    `SELECT email FROM users
     WHERE role IN ('platform_admin','support') AND status = 'active'`
  );
  const recipients = new Set(rows.map((r) => r.email.trim().toLowerCase()));
  if (platform.supportEmail?.trim()) {
    recipients.add(platform.supportEmail.trim().toLowerCase());
  }
  if (!recipients.size) return;

  const base =
    platform.publicAppUrl?.trim() ||
    process.env.APP_URL ||
    "http://localhost:3471";
  const link = `${base.replace(/\/$/, "")}/admin/help?thread=${input.threadId}`;
  const subject = `Help chat: ${input.fromLabel}`;
  const text = `${input.fromLabel} wrote:\n\n${input.preview}\n\nOpen inbox: ${link}`;
  const html = `<p><strong>${input.fromLabel.replace(/</g, "&lt;")}</strong> wrote:</p><p>${input.preview.replace(/</g, "&lt;")}</p><p><a href="${link}">Open help inbox</a></p>`;

  for (const to of recipients) {
    try {
      await sendEmail({ to, subject, html, text });
    } catch (err) {
      console.error("[help/notify/email]", to, err);
    }
  }
}

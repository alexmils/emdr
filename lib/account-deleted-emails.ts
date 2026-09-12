import { getPool } from "@/lib/db";
import { getAppUrl, sendEmail, sendTemplateEmail } from "@/lib/email";
import { getPlatformSettings } from "@/lib/platform-settings";
import { BRAND_DOMAIN } from "@/lib/brand";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function adminRecipientEmails(): Promise<string[]> {
  const platform = await getPlatformSettings();
  const { rows } = await getPool().query<{ email: string }>(
    `SELECT email FROM users
     WHERE role IN ('platform_admin','support') AND status = 'active'`
  );
  const recipients = new Set(
    rows.map((r) => r.email.trim().toLowerCase()).filter(Boolean)
  );
  if (platform.supportEmail?.trim()) {
    recipients.add(platform.supportEmail.trim().toLowerCase());
  }
  return [...recipients];
}

/**
 * After a successful self-delete: confirm to the user, notify admins.
 * Failures are logged; they must not undo the deletion.
 */
export async function sendAccountDeletedEmails(input: {
  email: string;
  name: string | null;
  stripeCanceled: boolean;
}): Promise<void> {
  const platform = await getPlatformSettings();
  const displayName =
    input.name?.trim() || input.email.split("@")[0] || "there";
  const supportEmail =
    platform.supportEmail?.trim() || `hi@contact.${BRAND_DOMAIN}`;
  const homeUrl = await getAppUrl("/");

  try {
    await sendTemplateEmail(input.email, "account_deleted", {
      name: displayName,
      supportEmail,
      homeUrl,
    });
  } catch (err) {
    console.warn("[account-deleted] user confirmation email failed:", err);
  }

  const recipients = await adminRecipientEmails();
  if (!recipients.length) return;

  const siteName = platform.siteName?.trim() || "Nura";
  const activityUrl = await getAppUrl("/admin/activity");
  const stripeLine = input.stripeCanceled
    ? "Stripe subscription canceled."
    : "No Stripe subscription canceled (none found or cancel skipped).";
  const subject = `Account deleted: ${input.email}`;
  const text = `${displayName} (${input.email}) deleted their ${siteName} account.\n\n${stripeLine}\n\nActivity: ${activityUrl}`;
  const html = `<p><strong>${escapeHtml(displayName)}</strong> (${escapeHtml(input.email)}) deleted their ${escapeHtml(siteName)} account.</p><p>${escapeHtml(stripeLine)}</p><p><a href="${escapeHtml(activityUrl)}">Open activity log</a></p>`;

  for (const to of recipients) {
    try {
      await sendEmail({ to, subject, html, text });
    } catch (err) {
      console.error("[account-deleted] admin notify failed:", to, err);
    }
  }
}

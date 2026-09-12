import { getPool } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { sendAdminHelpPush } from "@/lib/admin-push";
import {
  escapeHtml,
  sanitizeEmailHeaderValue,
} from "@/lib/help-format";
import { shouldSendHelpAdminEmail } from "@/lib/help-notify-policy";
import { getPlatformSettings } from "@/lib/platform-settings";

async function threadEmailAlreadySent(threadId: string): Promise<boolean> {
  const { rows } = await getPool().query<{ sent: boolean }>(
    `SELECT (admin_email_sent_at IS NOT NULL) AS sent
     FROM help_threads WHERE id = $1`,
    [threadId]
  );
  return Boolean(rows[0]?.sent);
}

async function ipEmailAlreadySent(ipHash: string): Promise<boolean> {
  const { rows } = await getPool().query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM help_admin_email_ips
     WHERE ip_hash = $1`,
    [ipHash]
  );
  return Number(rows[0]?.count ?? 0) > 0;
}

/** Claim the one-shot email slot for this thread (race-safe). */
async function claimThreadAdminEmail(threadId: string): Promise<boolean> {
  const { rows } = await getPool().query<{ id: string }>(
    `UPDATE help_threads
     SET admin_email_sent_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND admin_email_sent_at IS NULL
     RETURNING id`,
    [threadId]
  );
  return Boolean(rows[0]?.id);
}

async function releaseThreadAdminEmail(threadId: string): Promise<void> {
  await getPool().query(
    `UPDATE help_threads
     SET admin_email_sent_at = NULL, updated_at = NOW()
     WHERE id = $1`,
    [threadId]
  );
}

/** Atomic once-per-IP claim so parallel guest threads cannot double-email. */
async function claimIpAdminEmail(ipHash: string): Promise<boolean> {
  const { rows } = await getPool().query<{ ip_hash: string }>(
    `INSERT INTO help_admin_email_ips (ip_hash, sent_at)
     VALUES ($1, NOW())
     ON CONFLICT (ip_hash) DO NOTHING
     RETURNING ip_hash`,
    [ipHash]
  );
  return Boolean(rows[0]?.ip_hash);
}

async function releaseIpAdminEmail(ipHash: string): Promise<void> {
  await getPool().query(
    `DELETE FROM help_admin_email_ips WHERE ip_hash = $1`,
    [ipHash]
  );
}

/** @returns true if at least one recipient email succeeded. */
async function sendHelpAdminEmail(input: {
  fromLabel: string;
  preview: string;
  threadId: string;
}): Promise<boolean> {
  const platform = await getPlatformSettings();
  const { rows } = await getPool().query<{ email: string }>(
    `SELECT email FROM users
     WHERE role IN ('platform_admin','support') AND status = 'active'`
  );
  const recipients = new Set(rows.map((r) => r.email.trim().toLowerCase()));
  if (platform.supportEmail?.trim()) {
    recipients.add(platform.supportEmail.trim().toLowerCase());
  }
  if (!recipients.size) return false;

  const base =
    platform.publicAppUrl?.trim() ||
    process.env.APP_URL ||
    "http://localhost:3471";
  const link = `${base.replace(/\/$/, "")}/admin/help?thread=${input.threadId}`;
  const fromLabel = sanitizeEmailHeaderValue(input.fromLabel);
  const preview = input.preview.slice(0, 200);
  const subject = sanitizeEmailHeaderValue(`Help chat: ${fromLabel}`);
  const text = `${fromLabel} wrote:\n\n${preview}\n\nOpen inbox: ${link}`;
  const html = `<p><strong>${escapeHtml(fromLabel)}</strong> wrote:</p><p>${escapeHtml(preview)}</p><p><a href="${escapeHtml(link)}">Open help inbox</a></p>`;

  let anyOk = false;
  for (const to of recipients) {
    try {
      await sendEmail({ to, subject, html, text });
      anyOk = true;
    } catch (err) {
      console.error("[help/notify/email]", to, err);
    }
  }
  return anyOk;
}

/**
 * Notify admins of a user help message.
 * Email: once per thread, and for guests only when the IP is new.
 * Push: every new user message (admin PWA subscriptions).
 */
export async function notifyAdminsOfHelpMessage(input: {
  fromLabel: string;
  preview: string;
  threadId: string;
  priorUserMessageCount: number;
  ipHash?: string | null;
  sendEmailEnabled: boolean;
}): Promise<void> {
  const path = `/admin/help?thread=${encodeURIComponent(input.threadId)}`;

  void sendAdminHelpPush({
    title: "New help message",
    body: `${input.fromLabel}: ${input.preview.slice(0, 120)}`,
    url: path,
    tag: `help-${input.threadId}`,
  }).catch((err) => console.error("[help/notify/push]", err));

  if (!input.sendEmailEnabled) return;

  const ipHash = input.ipHash?.trim() || null;
  const [threadSent, ipSent] = await Promise.all([
    threadEmailAlreadySent(input.threadId),
    ipHash ? ipEmailAlreadySent(ipHash) : Promise.resolve(false),
  ]);

  if (
    !shouldSendHelpAdminEmail({
      priorUserMessageCount: input.priorUserMessageCount,
      threadEmailAlreadySent: threadSent,
      ipHash,
      ipEmailAlreadySent: ipSent,
    })
  ) {
    return;
  }

  const claimed = await claimThreadAdminEmail(input.threadId);
  if (!claimed) return;

  let ipClaimed = false;
  if (ipHash) {
    ipClaimed = await claimIpAdminEmail(ipHash);
    if (!ipClaimed) {
      await releaseThreadAdminEmail(input.threadId);
      return;
    }
  }

  const sent = await sendHelpAdminEmail({
    fromLabel: input.fromLabel,
    preview: input.preview,
    threadId: input.threadId,
  });

  if (!sent) {
    await releaseThreadAdminEmail(input.threadId);
    if (ipClaimed && ipHash) await releaseIpAdminEmail(ipHash);
  }
}

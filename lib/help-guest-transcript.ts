import {
  listGuestThreadsDueForTranscript,
  listUserMessages,
  markGuestTranscriptSent,
  type HelpThread,
} from "@/lib/help-db";
import { formatHelpTranscript } from "@/lib/help-format";
import { sendEmail } from "@/lib/email";
import { BRAND_SPOKEN } from "@/lib/brand";
import { getPool } from "@/lib/db";

export async function sendGuestTranscriptEmail(
  thread: HelpThread
): Promise<boolean> {
  const email = thread.guestEmail?.trim();
  if (!email || thread.transcriptSentAt) return false;

  const messages = await listUserMessages(thread.id);
  if (!messages.some((m) => m.role === "user")) {
    return false;
  }

  const claimed = await markGuestTranscriptSent(thread.id);
  if (!claimed) return false;

  const { text: transcriptText, html: transcriptHtml } =
    formatHelpTranscript(messages);
  const name = thread.guestName?.trim();
  const greeting = name ? `Hi ${name},` : "Hi,";
  const subject = `Your ${BRAND_SPOKEN} help chat`;
  const text = `${greeting}

Here’s a copy of your help chat. We’ll reply to this email if you still need us.

${transcriptText}

— ${BRAND_SPOKEN}
`;
  const html = `<p>${greeting.replace(/</g, "&lt;")}</p>
<p>Here’s a copy of your help chat. We’ll reply to this email if you still need us.</p>
${transcriptHtml}
<p>— ${BRAND_SPOKEN}</p>`;

  try {
    await sendEmail({ to: email, subject, html, text });
    return true;
  } catch (err) {
    console.error("[help/guest-transcript]", thread.id, err);
    // Allow retry on next cron if delivery failed.
    await getPool().query(
      `UPDATE help_threads SET transcript_sent_at = NULL, updated_at = NOW()
       WHERE id = $1`,
      [thread.id]
    );
    return false;
  }
}

export async function processDueGuestTranscripts(): Promise<{
  scanned: number;
  sent: number;
}> {
  const due = await listGuestThreadsDueForTranscript();
  let sent = 0;
  for (const thread of due) {
    if (await sendGuestTranscriptEmail(thread)) sent += 1;
  }
  return { scanned: due.length, sent };
}

import { NextResponse } from "next/server";
import { requireAuth, isAuthContext } from "@/lib/api-auth";
import {
  addHelpMessage,
  getHelpSettings,
  getOrCreateOpenThread,
  listUserMessages,
  markThreadReadByUser,
} from "@/lib/help-db";
import { buildHelpAiMessages } from "@/lib/help-rag";
import { chatCompletion } from "@/lib/llm";
import { getLlmRuntimeConfig, getPlatformSettings } from "@/lib/platform-settings";
import { sendEmail } from "@/lib/email";
import { getPool } from "@/lib/db";

export async function GET() {
  const auth = await requireAuth();
  if (!isAuthContext(auth)) return auth;
  if (auth.user.role !== "user") {
    return NextResponse.json({ error: "Help chat is for user accounts" }, { status: 403 });
  }

  const settings = await getHelpSettings();
  if (!settings.enabled) {
    return NextResponse.json({ error: "Help chat is disabled", enabled: false }, { status: 503 });
  }

  const thread = await getOrCreateOpenThread(auth.user.id);
  const messages = await listUserMessages(thread.id);
  await markThreadReadByUser(thread.id, auth.user.id);

  return NextResponse.json({
    enabled: true,
    welcomeMessage: settings.welcomeMessage,
    thread,
    messages,
  });
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!isAuthContext(auth)) return auth;
  if (auth.user.role !== "user") {
    return NextResponse.json({ error: "Help chat is for user accounts" }, { status: 403 });
  }

  const settings = await getHelpSettings();
  if (!settings.enabled) {
    return NextResponse.json({ error: "Help chat is disabled" }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    message?: unknown;
  };
  const text =
    typeof body.message === "string" ? body.message.trim() : "";
  if (!text || text.length > 4000) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const thread = await getOrCreateOpenThread(auth.user.id);
  const history = await listUserMessages(thread.id);

  const userMsg = await addHelpMessage({
    threadId: thread.id,
    role: "user",
    content: text,
    authorUserId: auth.user.id,
    forAdminUnread: true,
  });

  // Notify admins (best-effort).
  if (settings.notifyAdminsByEmail) {
    void notifyAdminsOfHelpMessage({
      userEmail: auth.user.email,
      preview: text.slice(0, 200),
      threadId: thread.id,
    }).catch((err) => console.error("[help/notify]", err));
  }

  let assistantMsg = null;
  if (settings.aiFirstReply) {
    try {
      const llm = await getLlmRuntimeConfig();
      const messages = await buildHelpAiMessages({
        history: history.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        latestUserMessage: text,
      });
      const reply = (
        await chatCompletion(llm, messages, {
          userId: auth.user.id,
          purpose: "help",
        })
      ).trim();
      if (reply) {
        assistantMsg = await addHelpMessage({
          threadId: thread.id,
          role: "assistant",
          content: reply,
          forUserUnread: false,
        });
      }
    } catch (err) {
      console.error("[help/ai]", err);
      assistantMsg = await addHelpMessage({
        threadId: thread.id,
        role: "assistant",
        content:
          "Thanks — I couldn’t generate an automatic reply right now. A teammate will follow up soon.",
      });
    }
  }

  const messages = await listUserMessages(thread.id);
  return NextResponse.json({
    userMessage: userMsg,
    assistantMessage: assistantMsg,
    messages,
  });
}

async function notifyAdminsOfHelpMessage(input: {
  userEmail: string;
  preview: string;
  threadId: string;
}) {
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

  const base = platform.publicAppUrl?.trim() || process.env.APP_URL || "http://localhost:3471";
  const link = `${base.replace(/\/$/, "")}/admin/help?thread=${input.threadId}`;
  const subject = `Help chat: ${input.userEmail}`;
  const text = `${input.userEmail} wrote:\n\n${input.preview}\n\nOpen inbox: ${link}`;
  const html = `<p><strong>${input.userEmail}</strong> wrote:</p><p>${input.preview.replace(/</g, "&lt;")}</p><p><a href="${link}">Open help inbox</a></p>`;

  for (const to of recipients) {
    try {
      await sendEmail({ to, subject, html, text });
    } catch (err) {
      console.error("[help/notify/email]", to, err);
    }
  }
}

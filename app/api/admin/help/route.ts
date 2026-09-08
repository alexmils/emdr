import { NextResponse } from "next/server";
import {
  requireAdminAccess,
  requirePlatformAdmin,
  isAuthContext,
} from "@/lib/api-auth";
import {
  addHelpMessage,
  countUnreadAdmin,
  deleteKnowledge,
  getHelpSettings,
  getThreadById,
  listAdminThreads,
  listKnowledge,
  listUserMessages,
  markThreadReadByAdmin,
  saveHelpSettings,
  setThreadStatus,
  upsertKnowledge,
  type HelpThreadStatus,
} from "@/lib/help-db";

export async function GET(request: Request) {
  const auth = await requireAdminAccess();
  if (!isAuthContext(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") ?? "threads";
  const threadId = searchParams.get("threadId");

  if (view === "unread") {
    return NextResponse.json({ unread: await countUnreadAdmin() });
  }

  if (view === "settings") {
    return NextResponse.json({ settings: await getHelpSettings() });
  }

  if (view === "knowledge") {
    return NextResponse.json({ knowledge: await listKnowledge(true) });
  }

  if (threadId) {
    const thread = await getThreadById(threadId);
    if (!thread) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await markThreadReadByAdmin(threadId);
    const messages = await listUserMessages(threadId);
    return NextResponse.json({ thread, messages });
  }

  return NextResponse.json({
    threads: await listAdminThreads(),
    unread: await countUnreadAdmin(),
  });
}

export async function POST(request: Request) {
  const auth = await requireAdminAccess();
  if (!isAuthContext(auth)) return auth;

  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
    threadId?: string;
    message?: string;
    status?: HelpThreadStatus;
    settings?: Record<string, unknown>;
    knowledge?: {
      id?: string;
      title?: string;
      body?: string;
      tags?: string[];
      enabled?: boolean;
    };
    knowledgeId?: string;
  };

  if (body.action === "reply" && body.threadId && body.message?.trim()) {
    const thread = await getThreadById(body.threadId);
    if (!thread) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const msg = await addHelpMessage({
      threadId: body.threadId,
      role: "admin",
      content: body.message.trim(),
      authorUserId: auth.user.id,
      forUserUnread: true,
      forAdminUnread: false,
    });
    await markThreadReadByAdmin(body.threadId);
    return NextResponse.json({
      message: msg,
      messages: await listUserMessages(body.threadId),
    });
  }

  if (
    body.action === "status" &&
    body.threadId &&
    (body.status === "open" ||
      body.status === "waiting" ||
      body.status === "resolved")
  ) {
    await setThreadStatus(body.threadId, body.status);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "save_settings") {
    const admin = await requirePlatformAdmin();
    if (!isAuthContext(admin)) return admin;
    const settings = await saveHelpSettings(body.settings ?? {});
    return NextResponse.json({ settings });
  }

  if (body.action === "save_knowledge" && body.knowledge?.title && body.knowledge?.body) {
    const admin = await requirePlatformAdmin();
    if (!isAuthContext(admin)) return admin;
    const doc = await upsertKnowledge({
      id: body.knowledge.id,
      title: body.knowledge.title,
      body: body.knowledge.body,
      tags: body.knowledge.tags,
      enabled: body.knowledge.enabled,
    });
    return NextResponse.json({ knowledge: doc });
  }

  if (body.action === "delete_knowledge" && body.knowledgeId) {
    const admin = await requirePlatformAdmin();
    if (!isAuthContext(admin)) return admin;
    await deleteKnowledge(body.knowledgeId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

import { NextResponse } from "next/server";
import {
  isAuthContext,
  requireAdminAccess,
} from "@/lib/api-auth";
import {
  countUnreadFeedback,
  listFeedbackResponses,
  markAllFeedbackSeen,
} from "@/lib/feedback-db";

export async function GET(request: Request) {
  const auth = await requireAdminAccess();
  if (!isAuthContext(auth)) return auth;

  const { searchParams } = new URL(request.url);
  if (searchParams.get("view") === "unread") {
    return NextResponse.json({ unread: await countUnreadFeedback() });
  }

  const items = await listFeedbackResponses();
  const unread = await countUnreadFeedback();
  return NextResponse.json({ items, unread });
}

export async function POST(request: Request) {
  const auth = await requireAdminAccess();
  if (!isAuthContext(auth)) return auth;

  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
  };

  if (body.action === "mark_seen") {
    await markAllFeedbackSeen();
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

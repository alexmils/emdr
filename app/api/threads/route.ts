import { NextResponse } from "next/server";
import {
  listThreads,
  createThread,
  getThread,
  updateThread,
  deleteThread,
  listMessages,
  getThreadMemorySets,
  setThreadMemorySet,
  listMemorySets,
} from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (id) {
    const thread = await getThread(id);
    if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const messages = await listMessages(id);
    const memorySets = await getThreadMemorySets(id);
    const allSets = await listMemorySets();
    return NextResponse.json({ thread, messages, memorySets, allSets });
  }
  return NextResponse.json({ threads: await listThreads() });
}

export async function POST(request: Request) {
  const body = await request.json();
  if (body.action === "create") {
    const thread = await createThread(body.title || "New session");
    return NextResponse.json({ thread });
  }
  if (body.action === "update" && body.id) {
    const thread = await updateThread(body.id, body.patch ?? {});
    return NextResponse.json({ thread });
  }
  if (body.action === "delete" && body.id) {
    await deleteThread(body.id);
    return NextResponse.json({ ok: true });
  }
  if (body.action === "set_memory" && body.threadId && body.setId !== undefined) {
    await setThreadMemorySet(body.threadId, body.setId, Boolean(body.enabled));
    return NextResponse.json({
      memorySets: await getThreadMemorySets(body.threadId),
    });
  }
  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

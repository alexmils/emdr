import { NextResponse } from "next/server";
import {
  getSettings,
  saveSettings,
  listMemories,
  createMemory,
  listMemorySets,
  createMemorySet,
  addMemoryToSet,
  removeMemoryFromSet,
} from "@/lib/db";
import { withAuth } from "@/lib/api-auth";

export async function GET() {
  return withAuth(async () =>
    NextResponse.json({
      settings: await getSettings(),
      memories: await listMemories(),
      memorySets: await listMemorySets(),
    })
  );
}

export async function POST(request: Request) {
  return withAuth(async () => {
    const body = await request.json();

    if (body.action === "save_settings") {
      await saveSettings(body.settings);
      return NextResponse.json({ settings: await getSettings() });
    }
    if (body.action === "create_memory") {
      const memory = await createMemory(body.title, body.body);
      return NextResponse.json({ memory, memories: await listMemories() });
    }
    if (body.action === "create_set") {
      const set = await createMemorySet(body.name);
      return NextResponse.json({ set, memorySets: await listMemorySets() });
    }
    if (body.action === "add_to_set") {
      await addMemoryToSet(body.setId, body.memoryId);
      return NextResponse.json({ memorySets: await listMemorySets() });
    }
    if (body.action === "remove_from_set") {
      await removeMemoryFromSet(body.setId, body.memoryId);
      return NextResponse.json({ memorySets: await listMemorySets() });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  });
}

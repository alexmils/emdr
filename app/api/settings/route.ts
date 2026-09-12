import { NextResponse } from "next/server";
import {
  getSettings,
  saveSettings,
  listMemories,
  createMemory,
  createMemories,
  updateMemory,
  deleteMemory,
  listMemorySets,
  createMemorySet,
  updateMemorySet,
  deleteMemorySet,
  findMemorySetByName,
  addMemoryToSet,
  removeMemoryFromSet,
} from "@/lib/db";
import { withAuth } from "@/lib/api-auth";
import { getPlatformSettings } from "@/lib/platform-settings";
import {
  IMPORT_BODY_MAX_CHARS,
  IMPORT_MAX_NOTES,
  IMPORT_TITLE_MAX_CHARS,
} from "@/lib/memory-import";

const MEMORY_OFF = "Memory is turned off";

async function memoryEnabled(): Promise<boolean> {
  const platform = await getPlatformSettings();
  return platform.flags.memory !== false;
}

async function voiceEnabledFlag(): Promise<boolean> {
  const platform = await getPlatformSettings();
  return platform.flags.voice !== false;
}

function trimStr(v: unknown, max: number): string {
  return String(v ?? "")
    .trim()
    .slice(0, max);
}

export async function GET() {
  return withAuth(async () => {
    const platform = await getPlatformSettings();
    const enabled = platform.flags.memory !== false;
    const voiceEnabled = platform.flags.voice !== false;
    return NextResponse.json({
      settings: await getSettings(),
      memories: enabled ? await listMemories() : [],
      memorySets: enabled ? await listMemorySets() : [],
      memoryEnabled: enabled,
      voiceEnabled,
      guidedChatChromeId: platform.guidedChatChromeId,
      freeSessionChromeId: platform.freeSessionChromeId,
    });
  });
}

export async function POST(request: Request) {
  return withAuth(async () => {
    const body = await request.json();
    const enabled = await memoryEnabled();

    if (body.action === "save_settings") {
      await saveSettings(body.settings);
      return NextResponse.json({ settings: await getSettings() });
    }

    const memoryActions = new Set([
      "create_memory",
      "update_memory",
      "delete_memory",
      "create_set",
      "update_set",
      "delete_set",
      "add_to_set",
      "remove_from_set",
      "import_memories",
    ]);
    if (memoryActions.has(body.action) && !enabled) {
      return NextResponse.json({ error: MEMORY_OFF }, { status: 403 });
    }

    if (body.action === "create_memory") {
      const title = trimStr(body.title, IMPORT_TITLE_MAX_CHARS);
      const text = trimStr(body.body, IMPORT_BODY_MAX_CHARS);
      if (!title || !text) {
        return NextResponse.json(
          { error: "Title and note are required" },
          { status: 400 }
        );
      }
      const memory = await createMemory(title, text);
      return NextResponse.json({ memory, memories: await listMemories() });
    }
    if (body.action === "update_memory") {
      const title = trimStr(body.title, IMPORT_TITLE_MAX_CHARS);
      const text = trimStr(body.body, IMPORT_BODY_MAX_CHARS);
      if (!body.id || !title || !text) {
        return NextResponse.json({ error: "Invalid memory" }, { status: 400 });
      }
      const memory = await updateMemory(String(body.id), title, text);
      if (!memory) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({ memory, memories: await listMemories() });
    }
    if (body.action === "delete_memory") {
      if (!body.id) {
        return NextResponse.json({ error: "Invalid memory" }, { status: 400 });
      }
      await deleteMemory(String(body.id));
      return NextResponse.json({ memories: await listMemories(), memorySets: await listMemorySets() });
    }
    if (body.action === "create_set") {
      const name = trimStr(body.name, IMPORT_TITLE_MAX_CHARS);
      if (!name) {
        return NextResponse.json({ error: "Set name is required" }, { status: 400 });
      }
      const set = await createMemorySet(name);
      return NextResponse.json({ set, memorySets: await listMemorySets() });
    }
    if (body.action === "update_set") {
      const name = trimStr(body.name, IMPORT_TITLE_MAX_CHARS);
      if (!body.id || !name) {
        return NextResponse.json({ error: "Invalid set" }, { status: 400 });
      }
      const set = await updateMemorySet(String(body.id), name);
      if (!set) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({ set, memorySets: await listMemorySets() });
    }
    if (body.action === "delete_set") {
      if (!body.id) {
        return NextResponse.json({ error: "Invalid set" }, { status: 400 });
      }
      await deleteMemorySet(String(body.id));
      return NextResponse.json({ memorySets: await listMemorySets() });
    }
    if (body.action === "add_to_set") {
      try {
        await addMemoryToSet(String(body.setId), String(body.memoryId));
      } catch {
        return NextResponse.json({ error: "Could not add to set" }, { status: 400 });
      }
      return NextResponse.json({ memorySets: await listMemorySets() });
    }
    if (body.action === "remove_from_set") {
      await removeMemoryFromSet(String(body.setId), String(body.memoryId));
      return NextResponse.json({ memorySets: await listMemorySets() });
    }
    if (body.action === "import_memories") {
      const rawNotes = Array.isArray(body.notes) ? body.notes : [];
      if (!rawNotes.length) {
        return NextResponse.json({ error: "No notes to import" }, { status: 400 });
      }
      if (rawNotes.length > IMPORT_MAX_NOTES) {
        return NextResponse.json(
          { error: "Import up to 40 at a time. Deselect some, then try again." },
          { status: 400 }
        );
      }
      const notes = rawNotes
        .map((n: { title?: unknown; body?: unknown }) => ({
          title: trimStr(n?.title, IMPORT_TITLE_MAX_CHARS) || "Imported note",
          body: trimStr(n?.body, IMPORT_BODY_MAX_CHARS),
        }))
        .filter((n: { body: string }) => n.body.length > 0);
      if (!notes.length) {
        return NextResponse.json({ error: "No notes to import" }, { status: 400 });
      }
      const created = await createMemories(notes);
      const setName = trimStr(body.setName, IMPORT_TITLE_MAX_CHARS);
      if (setName && created.length) {
        let set = await findMemorySetByName(setName);
        if (!set) set = await createMemorySet(setName);
        for (const m of created) {
          await addMemoryToSet(set.id, m.id);
        }
      }
      return NextResponse.json({
        imported: created.length,
        memories: await listMemories(),
        memorySets: await listMemorySets(),
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  });
}

import { Pool, type QueryResultRow } from "pg";
import type {
  AppSettings,
  Memory,
  MemorySet,
  Message,
  Thread,
  ThreadMemorySet,
} from "./types";
import { DEFAULT_SETTINGS } from "./types";

let pool: Pool | null = null;
let schemaReady: Promise<void> | null = null;

function getPool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Start Postgres (docker compose up -d) or set a connection string in .env"
    );
  }
  if (!pool) {
    pool = new Pool({ connectionString: url });
  }
  return pool;
}

async function ensureSchema() {
  const db = getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS threads (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      phase TEXT NOT NULL DEFAULT 'grounding',
      target TEXT,
      negative_cognition TEXT,
      positive_cognition TEXT,
      suds INTEGER,
      voc INTEGER,
      summary TEXT,
      incomplete BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    );
    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    );
    CREATE TABLE IF NOT EXISTS memory_sets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS memory_set_items (
      set_id TEXT NOT NULL REFERENCES memory_sets(id) ON DELETE CASCADE,
      memory_id TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
      PRIMARY KEY (set_id, memory_id)
    );
    CREATE TABLE IF NOT EXISTS thread_memory_sets (
      thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
      set_id TEXT NOT NULL REFERENCES memory_sets(id) ON DELETE CASCADE,
      enabled BOOLEAN NOT NULL DEFAULT FALSE,
      PRIMARY KEY (thread_id, set_id)
    );
    CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      json JSONB NOT NULL
    );
  `);

  const { rows } = await db.query<{ json: AppSettings }>(
    "SELECT json FROM app_settings WHERE id = 1"
  );
  if (!rows.length) {
    await db.query("INSERT INTO app_settings (id, json) VALUES (1, $1)", [
      DEFAULT_SETTINGS,
    ]);
  }
}

async function db() {
  if (!schemaReady) schemaReady = ensureSchema();
  await schemaReady;
  return getPool();
}

function rowToThread(row: QueryResultRow): Thread {
  return {
    id: row.id as string,
    title: row.title as string,
    phase: row.phase as Thread["phase"],
    target: (row.target as string) ?? undefined,
    negativeCognition: (row.negative_cognition as string) ?? undefined,
    positiveCognition: (row.positive_cognition as string) ?? undefined,
    suds: row.suds != null ? Number(row.suds) : undefined,
    voc: row.voc != null ? Number(row.voc) : undefined,
    summary: (row.summary as string) ?? undefined,
    incomplete: Boolean(row.incomplete),
    createdAt: new Date(row.created_at as string).toISOString(),
    updatedAt: new Date(row.updated_at as string).toISOString(),
  };
}

export async function listThreads(): Promise<Thread[]> {
  const { rows } = await (
    await db()
  ).query("SELECT * FROM threads ORDER BY updated_at DESC");
  return rows.map(rowToThread);
}

export async function getThread(id: string): Promise<Thread | null> {
  const { rows } = await (
    await db()
  ).query("SELECT * FROM threads WHERE id = $1", [id]);
  return rows[0] ? rowToThread(rows[0]) : null;
}

export async function createThread(title: string): Promise<Thread> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  await (
    await db()
  ).query(
    `INSERT INTO threads (id, title, phase, incomplete, created_at, updated_at)
     VALUES ($1, $2, 'grounding', TRUE, $3, $3)`,
    [id, title, now]
  );
  return (await getThread(id))!;
}

export async function updateThread(
  id: string,
  patch: Partial<Omit<Thread, "id" | "createdAt">>
): Promise<Thread | null> {
  const existing = await getThread(id);
  if (!existing) return null;
  const merged = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  await (
    await db()
  ).query(
    `UPDATE threads SET title=$1, phase=$2, target=$3, negative_cognition=$4, positive_cognition=$5,
     suds=$6, voc=$7, summary=$8, incomplete=$9, updated_at=$10 WHERE id=$11`,
    [
      merged.title,
      merged.phase,
      merged.target ?? null,
      merged.negativeCognition ?? null,
      merged.positiveCognition ?? null,
      merged.suds ?? null,
      merged.voc ?? null,
      merged.summary ?? null,
      merged.incomplete,
      merged.updatedAt,
      id,
    ]
  );
  return getThread(id);
}

export async function deleteThread(id: string) {
  const client = await db();
  await client.query("DELETE FROM messages WHERE thread_id = $1", [id]);
  await client.query("DELETE FROM thread_memory_sets WHERE thread_id = $1", [id]);
  await client.query("DELETE FROM threads WHERE id = $1", [id]);
}

export async function listMessages(threadId: string): Promise<Message[]> {
  const { rows } = await (
    await db()
  ).query(
    "SELECT * FROM messages WHERE thread_id = $1 ORDER BY created_at ASC",
    [threadId]
  );
  return rows.map((r) => ({
    id: r.id as string,
    threadId: r.thread_id as string,
    role: r.role as Message["role"],
    content: r.content as string,
    createdAt: new Date(r.created_at as string).toISOString(),
  }));
}

export async function addMessage(
  threadId: string,
  role: Message["role"],
  content: string
): Promise<Message> {
  const msg: Message = {
    id: crypto.randomUUID(),
    threadId,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
  const client = await db();
  await client.query(
    "INSERT INTO messages (id, thread_id, role, content, created_at) VALUES ($1, $2, $3, $4, $5)",
    [msg.id, msg.threadId, msg.role, msg.content, msg.createdAt]
  );
  await client.query("UPDATE threads SET updated_at = $1 WHERE id = $2", [
    msg.createdAt,
    threadId,
  ]);
  return msg;
}

export async function getSettings(): Promise<AppSettings> {
  const { rows } = await (
    await db()
  ).query<{ json: AppSettings }>("SELECT json FROM app_settings WHERE id = 1");
  return { ...DEFAULT_SETTINGS, ...rows[0].json };
}

export async function saveSettings(settings: AppSettings) {
  await (
    await db()
  ).query("UPDATE app_settings SET json = $1 WHERE id = 1", [settings]);
}

export async function listMemories(): Promise<Memory[]> {
  const { rows } = await (
    await db()
  ).query("SELECT * FROM memories ORDER BY created_at DESC");
  return rows.map((r) => ({
    id: r.id as string,
    title: r.title as string,
    body: r.body as string,
    createdAt: new Date(r.created_at as string).toISOString(),
  }));
}

export async function createMemory(title: string, body: string): Promise<Memory> {
  const m: Memory = {
    id: crypto.randomUUID(),
    title,
    body,
    createdAt: new Date().toISOString(),
  };
  await (
    await db()
  ).query(
    "INSERT INTO memories (id, title, body, created_at) VALUES ($1, $2, $3, $4)",
    [m.id, m.title, m.body, m.createdAt]
  );
  return m;
}

export async function listMemorySets(): Promise<MemorySet[]> {
  const client = await db();
  const { rows: sets } = await client.query<{ id: string; name: string }>(
    "SELECT * FROM memory_sets ORDER BY name ASC"
  );
  const result: MemorySet[] = [];
  for (const s of sets) {
    const { rows } = await client.query<{ memory_id: string }>(
      "SELECT memory_id FROM memory_set_items WHERE set_id = $1",
      [s.id]
    );
    result.push({
      id: s.id,
      name: s.name,
      memoryIds: rows.map((r) => r.memory_id),
    });
  }
  return result;
}

export async function createMemorySet(name: string): Promise<MemorySet> {
  const set: MemorySet = { id: crypto.randomUUID(), name, memoryIds: [] };
  await (
    await db()
  ).query("INSERT INTO memory_sets (id, name) VALUES ($1, $2)", [
    set.id,
    set.name,
  ]);
  return set;
}

export async function addMemoryToSet(setId: string, memoryId: string) {
  await (
    await db()
  ).query(
    "INSERT INTO memory_set_items (set_id, memory_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [setId, memoryId]
  );
}

export async function removeMemoryFromSet(setId: string, memoryId: string) {
  await (
    await db()
  ).query(
    "DELETE FROM memory_set_items WHERE set_id = $1 AND memory_id = $2",
    [setId, memoryId]
  );
}

export async function getThreadMemorySets(
  threadId: string
): Promise<ThreadMemorySet[]> {
  const { rows } = await (
    await db()
  ).query(
    "SELECT * FROM thread_memory_sets WHERE thread_id = $1",
    [threadId]
  );
  return rows.map((r) => ({
    threadId: r.thread_id as string,
    setId: r.set_id as string,
    enabled: Boolean(r.enabled),
  }));
}

export async function setThreadMemorySet(
  threadId: string,
  setId: string,
  enabled: boolean
) {
  await (
    await db()
  ).query(
    `INSERT INTO thread_memory_sets (thread_id, set_id, enabled) VALUES ($1, $2, $3)
     ON CONFLICT (thread_id, set_id) DO UPDATE SET enabled = EXCLUDED.enabled`,
    [threadId, setId, enabled]
  );
}

export async function getEnabledMemoryContext(threadId: string): Promise<string> {
  const enabled = (await getThreadMemorySets(threadId)).filter((t) => t.enabled);
  if (!enabled.length) return "";
  const sets = (await listMemorySets()).filter((s) =>
    enabled.some((e) => e.setId === s.id)
  );
  const memories = await listMemories();
  const lines: string[] = [];
  for (const set of sets) {
    lines.push(`[${set.name}]`);
    for (const mid of set.memoryIds) {
      const m = memories.find((x) => x.id === mid);
      if (m) lines.push(`- ${m.title}: ${m.body}`);
    }
  }
  return lines.join("\n");
}

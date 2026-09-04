import { Pool, type PoolClient, type QueryResultRow } from "pg";
import type {
  AppSettings,
  Memory,
  MemorySet,
  Message,
  Thread,
  ThreadMemorySet,
} from "./types";
import { DEFAULT_SETTINGS } from "./types";
import {
  DEFAULT_PLATFORM_SETTINGS,
} from "./platform-settings";
import { ensureAuthFunctions } from "./auth/db-auth";
import { ensureRlsPolicies } from "./rls-policies";
import { dbQuery } from "./rls";
import { getRlsContext } from "./rls";

let pool: Pool | null = null;
let schemaDone = false;
let schemaInflight: Promise<void> | null = null;

/** Postgres advisory lock — serializes DDL across concurrent requests/workers. */
const SCHEMA_LOCK_ID = 74829101;

function isConcurrentCatalogError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("tuple concurrently updated");
}

export function getPool(): Pool {
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

/**
 * Hold advisory lock + run all DDL on the SAME connection.
 * pool.query() would release the connection after each statement and break the lock.
 */
async function ensureSchema() {
  const client = await getPool().connect();
  try {
    await client.query("SELECT pg_advisory_lock($1)", [SCHEMA_LOCK_ID]);
    try {
      await runSchemaMigrations(client);
    } finally {
      await client.query("SELECT pg_advisory_unlock($1)", [SCHEMA_LOCK_ID]);
    }
  } finally {
    client.release();
  }
}

async function runSchemaMigrations(db: PoolClient) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      password_hash TEXT,
      email_verified BOOLEAN NOT NULL DEFAULT FALSE,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );
    CREATE TABLE IF NOT EXISTS auth_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('reset', 'invite')),
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL
    );
    CREATE TABLE IF NOT EXISTS threads (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
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
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    );
    CREATE TABLE IF NOT EXISTS memory_sets (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
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
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      json JSONB NOT NULL
    );
    CREATE TABLE IF NOT EXISTS subscriptions (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      plan TEXT NOT NULL DEFAULT 'free',
      status TEXT NOT NULL DEFAULT 'active',
      amount_cents INTEGER NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'EUR',
      renews_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_auth_tokens_user ON auth_tokens(user_id);
    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      target_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      detail JSONB,
      ip TEXT,
      created_at TIMESTAMPTZ NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_audit_events_created ON audit_events(created_at DESC);
    CREATE TABLE IF NOT EXISTS webauthn_credentials (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      credential_id TEXT NOT NULL UNIQUE,
      public_key TEXT NOT NULL,
      counter BIGINT NOT NULL DEFAULT 0,
      transports JSONB NOT NULL DEFAULT '[]'::jsonb,
      device_type TEXT NOT NULL DEFAULT 'singleDevice',
      backed_up BOOLEAN NOT NULL DEFAULT FALSE,
      friendly_name TEXT,
      created_at TIMESTAMPTZ NOT NULL,
      last_used_at TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_user ON webauthn_credentials(user_id);
  `);

  await db.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
    ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
    ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
  `);

  await db.query(`
    DO $$ BEGIN
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
      ALTER TABLE users ADD CONSTRAINT users_role_check
        CHECK (role IN ('platform_admin', 'support', 'user'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);

  await db.query(`
    DO $$ BEGIN
      ALTER TABLE users ADD CONSTRAINT users_status_check
        CHECK (status IN ('active', 'disabled'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);

  await db.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    ALTER TABLE threads ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
    ALTER TABLE threads ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'guided';
    ALTER TABLE threads ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE memories ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
    ALTER TABLE memory_sets ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_threads_user ON threads(user_id);
    CREATE INDEX IF NOT EXISTS idx_memories_user ON memories(user_id);
    CREATE INDEX IF NOT EXISTS idx_memory_sets_user ON memory_sets(user_id);
  `);

  const { rows } = await db.query<{ json: unknown }>(
    "SELECT json FROM app_settings WHERE id = 1"
  );
  const legacyUserSettings =
    rows[0]?.json &&
    typeof rows[0].json === "object" &&
    "autoVoice" in (rows[0].json as Record<string, unknown>) &&
    !("siteName" in (rows[0].json as Record<string, unknown>));

  if (!rows.length || legacyUserSettings) {
    await db.query(
      `INSERT INTO app_settings (id, json) VALUES (1, $1)
       ON CONFLICT (id) DO UPDATE SET json = EXCLUDED.json`,
      [JSON.stringify(DEFAULT_PLATFORM_SETTINGS)]
    );
  }

  await ensureAuthFunctions(db);
  await ensureRlsPolicies(db);
}

async function ensureSchemaWithRetry(attempts = 4): Promise<void> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      await ensureSchema();
      return;
    } catch (err) {
      lastErr = err;
      if (!isConcurrentCatalogError(err) || i === attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, 40 * (i + 1)));
    }
  }
  throw lastErr;
}

export async function ensureSchemaReady(): Promise<void> {
  if (schemaDone) return;
  if (!schemaInflight) {
    schemaInflight = ensureSchemaWithRetry()
      .then(() => {
        schemaDone = true;
      })
      .catch((err) => {
        schemaInflight = null;
        throw err;
      });
  }
  await schemaInflight;
}

function rowToThread(row: QueryResultRow): Thread {
  return {
    id: row.id as string,
    title: row.title as string,
    mode: ((row.mode as Thread["mode"]) ?? "guided") as Thread["mode"],
    phase: row.phase as Thread["phase"],
    target: (row.target as string) ?? undefined,
    negativeCognition: (row.negative_cognition as string) ?? undefined,
    positiveCognition: (row.positive_cognition as string) ?? undefined,
    suds: row.suds != null ? Number(row.suds) : undefined,
    voc: row.voc != null ? Number(row.voc) : undefined,
    summary: (row.summary as string) ?? undefined,
    description: (row.description as string) ?? undefined,
    incomplete: Boolean(row.incomplete),
    createdAt: new Date(row.created_at as string).toISOString(),
    updatedAt: new Date(row.updated_at as string).toISOString(),
  };
}

export async function listThreads(): Promise<Thread[]> {
  const { userId } = getRlsContext();
  const { rows } = await dbQuery(
    "SELECT * FROM threads WHERE user_id = $1 ORDER BY updated_at DESC",
    [userId]
  );
  return rows.map(rowToThread);
}

export async function getThread(id: string): Promise<Thread | null> {
  const { rows } = await dbQuery("SELECT * FROM threads WHERE id = $1", [id]);
  return rows[0] ? rowToThread(rows[0]) : null;
}

export async function createThread(title: string): Promise<Thread> {
  const { userId } = getRlsContext();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  await dbQuery(
    `INSERT INTO threads (id, user_id, title, phase, mode, incomplete, created_at, updated_at)
     VALUES ($1, $2, $3, 'grounding', 'pending', TRUE, $4, $4)`,
    [id, userId, title, now]
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
  await dbQuery(
    `UPDATE threads SET title=$1, phase=$2, target=$3, negative_cognition=$4, positive_cognition=$5,
     suds=$6, voc=$7, summary=$8, incomplete=$9, mode=$10, description=$11, updated_at=$12 WHERE id=$13`,
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
      merged.mode,
      merged.description?.trim() ? merged.description.trim() : null,
      merged.updatedAt,
      id,
    ]
  );
  return getThread(id);
}

export async function deleteThread(id: string) {
  await dbQuery("DELETE FROM messages WHERE thread_id = $1", [id]);
  await dbQuery("DELETE FROM thread_memory_sets WHERE thread_id = $1", [id]);
  await dbQuery("DELETE FROM threads WHERE id = $1", [id]);
}

export async function listMessages(threadId: string): Promise<Message[]> {
  const { rows } = await dbQuery(
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
  await dbQuery(
    "INSERT INTO messages (id, thread_id, role, content, created_at) VALUES ($1, $2, $3, $4, $5)",
    [msg.id, msg.threadId, msg.role, msg.content, msg.createdAt]
  );
  await dbQuery("UPDATE threads SET updated_at = $1 WHERE id = $2", [
    msg.createdAt,
    threadId,
  ]);
  return msg;
}

function normalizeUserSettings(raw: unknown): AppSettings {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_SETTINGS };
  const o = raw as Partial<AppSettings>;
  return { autoVoice: Boolean(o.autoVoice) };
}

export async function getSettings(): Promise<AppSettings> {
  const { userId } = getRlsContext();
  const { rows } = await dbQuery<{ json: unknown }>(
    "SELECT json FROM user_settings WHERE user_id = $1",
    [userId]
  );
  if (!rows[0]) {
    await dbQuery(
      "INSERT INTO user_settings (user_id, json) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [userId, DEFAULT_SETTINGS]
    );
    return { ...DEFAULT_SETTINGS };
  }
  return normalizeUserSettings(rows[0].json);
}

export async function saveSettings(settings: AppSettings) {
  const { userId } = getRlsContext();
  const normalized = normalizeUserSettings(settings);
  await dbQuery(
    `INSERT INTO user_settings (user_id, json) VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET json = EXCLUDED.json`,
    [userId, normalized]
  );
}

export async function listMemories(): Promise<Memory[]> {
  const { rows } = await dbQuery(
    "SELECT * FROM memories ORDER BY created_at DESC"
  );
  return rows.map((r) => ({
    id: r.id as string,
    title: r.title as string,
    body: r.body as string,
    createdAt: new Date(r.created_at as string).toISOString(),
  }));
}

export async function createMemory(title: string, body: string): Promise<Memory> {
  const { userId } = getRlsContext();
  const m: Memory = {
    id: crypto.randomUUID(),
    title,
    body,
    createdAt: new Date().toISOString(),
  };
  await dbQuery(
    "INSERT INTO memories (id, user_id, title, body, created_at) VALUES ($1, $2, $3, $4, $5)",
    [m.id, userId, m.title, m.body, m.createdAt]
  );
  return m;
}

export async function listMemorySets(): Promise<MemorySet[]> {
  const { rows: sets } = await dbQuery<{ id: string; name: string }>(
    "SELECT * FROM memory_sets ORDER BY name ASC"
  );
  const result: MemorySet[] = [];
  for (const s of sets) {
    const { rows } = await dbQuery<{ memory_id: string }>(
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
  const { userId } = getRlsContext();
  const set: MemorySet = { id: crypto.randomUUID(), name, memoryIds: [] };
  await dbQuery(
    "INSERT INTO memory_sets (id, user_id, name) VALUES ($1, $2, $3)",
    [set.id, userId, set.name]
  );
  return set;
}

export async function addMemoryToSet(setId: string, memoryId: string) {
  await dbQuery(
    "INSERT INTO memory_set_items (set_id, memory_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [setId, memoryId]
  );
}

export async function removeMemoryFromSet(setId: string, memoryId: string) {
  await dbQuery(
    "DELETE FROM memory_set_items WHERE set_id = $1 AND memory_id = $2",
    [setId, memoryId]
  );
}

export async function getThreadMemorySets(
  threadId: string
): Promise<ThreadMemorySet[]> {
  const { rows } = await dbQuery(
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
  await dbQuery(
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

import { rewriteRetiredBrandCopy } from "@/lib/brand";
import { ensureSchemaReady, getPool } from "@/lib/db";
import {
  DEFAULT_HELP_SETTINGS,
  normalizeHelpSettings,
  type HelpSettings,
} from "@/lib/help-settings";
import {
  getPlatformSettings,
  savePlatformSettings,
  type PlatformSettings,
} from "@/lib/platform-settings";

export type HelpThreadStatus = "open" | "waiting" | "resolved";
export type HelpMessageRole = "user" | "assistant" | "admin";

export type HelpThread = {
  id: string;
  userId: string;
  subject: string;
  status: HelpThreadStatus;
  unreadAdmin: boolean;
  unreadUser: boolean;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  userEmail?: string;
  userName?: string | null;
};

export type HelpMessage = {
  id: string;
  threadId: string;
  role: HelpMessageRole;
  authorUserId: string | null;
  content: string;
  createdAt: string;
};

export type HelpKnowledgeDoc = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type { HelpSettings };
export { DEFAULT_HELP_SETTINGS, normalizeHelpSettings };

let helpSchemaDone = false;

export async function ensureHelpSchema(): Promise<void> {
  await ensureSchemaReady();
  if (helpSchemaDone) return;
  const db = getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS help_threads (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject TEXT NOT NULL DEFAULT 'Help',
      status TEXT NOT NULL DEFAULT 'open',
      unread_admin BOOLEAN NOT NULL DEFAULT TRUE,
      unread_user BOOLEAN NOT NULL DEFAULT FALSE,
      last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_help_threads_user ON help_threads(user_id);
    CREATE INDEX IF NOT EXISTS idx_help_threads_admin
      ON help_threads(unread_admin, last_message_at DESC);

    CREATE TABLE IF NOT EXISTS help_messages (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL REFERENCES help_threads(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      author_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_help_messages_thread
      ON help_messages(thread_id, created_at ASC);

    CREATE TABLE IF NOT EXISTS help_knowledge (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      tags JSONB NOT NULL DEFAULT '[]'::jsonb,
      enabled BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const { rows } = await db.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM help_knowledge`
  );
  if (Number(rows[0]?.count ?? 0) === 0) {
    const seeds: { title: string; body: string; tags: string[] }[] = [
      {
        title: "What Nura is",
        body: "Nura (NuraHelp) is a self-help wellness tool with guided sessions and bilateral stimulation (BLS). It is not a licensed therapist, not emergency care, and not a medical device. Users should seek professional help for clinical needs.",
        tags: ["product", "safety"],
      },
      {
        title: "Billing and trial",
        body: "New users start a 7-day trial after adding a payment method. Trial includes up to 3 guided sessions and 10 minutes of free BLS. After the trial, the chosen weekly, monthly, or yearly plan renews. Manage or cancel from Billing → Manage billing (Stripe Customer Portal).",
        tags: ["billing", "trial"],
      },
      {
        title: "Session modes",
        body: "Guided mode uses an AI guide through wellness phases with check-ins. Free mode is BLS-only controls. Start a session with New chat, then choose Guided or Free.",
        tags: ["sessions", "bls"],
      },
      {
        title: "Crisis redirect",
        body: "If someone is in crisis or mentions self-harm, do not provide therapy. Tell them to contact local emergency services or a crisis hotline immediately. Keep the reply short and caring.",
        tags: ["safety", "crisis"],
      },
    ];
    for (const s of seeds) {
      await db.query(
        `INSERT INTO help_knowledge (id, title, body, tags, enabled, created_at, updated_at)
         VALUES ($1,$2,$3,$4::jsonb,TRUE,NOW(),NOW())`,
        [crypto.randomUUID(), s.title, s.body, JSON.stringify(s.tags)]
      );
    }
  }

  await remapRetiredHelpKnowledge(db);

  helpSchemaDone = true;
}

async function remapRetiredHelpKnowledge(
  db: ReturnType<typeof getPool>
): Promise<void> {
  const { rows } = await db.query<{ id: string; title: string; body: string }>(
    `SELECT id, title, body FROM help_knowledge`
  );
  for (const row of rows) {
    const title = rewriteRetiredBrandCopy(row.title);
    const body = rewriteRetiredBrandCopy(row.body);
    if (title === row.title && body === row.body) continue;
    await db.query(
      `UPDATE help_knowledge SET title = $1, body = $2, updated_at = NOW() WHERE id = $3`,
      [title, body, row.id]
    );
  }
}

export async function getHelpSettings(): Promise<HelpSettings> {
  const platform = await getPlatformSettings();
  return normalizeHelpSettings(platform.help);
}

export async function saveHelpSettings(
  patch: Partial<HelpSettings>
): Promise<HelpSettings> {
  const platform = await getPlatformSettings();
  const next = normalizeHelpSettings({
    ...normalizeHelpSettings(platform.help),
    ...patch,
  });
  const merged: PlatformSettings = { ...platform, help: next };
  await savePlatformSettings(merged);
  return next;
}

function rowThread(r: Record<string, unknown>): HelpThread {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    subject: r.subject as string,
    status: r.status as HelpThreadStatus,
    unreadAdmin: Boolean(r.unread_admin),
    unreadUser: Boolean(r.unread_user),
    lastMessageAt: new Date(r.last_message_at as string).toISOString(),
    createdAt: new Date(r.created_at as string).toISOString(),
    updatedAt: new Date(r.updated_at as string).toISOString(),
    userEmail: (r.email as string) ?? undefined,
    userName: (r.name as string | null) ?? undefined,
  };
}

function rowMessage(r: Record<string, unknown>): HelpMessage {
  return {
    id: r.id as string,
    threadId: r.thread_id as string,
    role: r.role as HelpMessageRole,
    authorUserId: (r.author_user_id as string) ?? null,
    content: r.content as string,
    createdAt: new Date(r.created_at as string).toISOString(),
  };
}

function rowKnowledge(r: Record<string, unknown>): HelpKnowledgeDoc {
  const tags = r.tags;
  return {
    id: r.id as string,
    title: r.title as string,
    body: r.body as string,
    tags: Array.isArray(tags)
      ? tags.map(String)
      : typeof tags === "string"
        ? (JSON.parse(tags) as string[])
        : [],
    enabled: Boolean(r.enabled),
    createdAt: new Date(r.created_at as string).toISOString(),
    updatedAt: new Date(r.updated_at as string).toISOString(),
  };
}

export async function getOrCreateOpenThread(
  userId: string
): Promise<HelpThread> {
  await ensureHelpSchema();
  const db = getPool();
  const existing = await db.query(
    `SELECT * FROM help_threads
     WHERE user_id = $1 AND status <> 'resolved'
     ORDER BY last_message_at DESC LIMIT 1`,
    [userId]
  );
  if (existing.rows[0]) return rowThread(existing.rows[0]);

  const id = crypto.randomUUID();
  const { rows } = await db.query(
    `INSERT INTO help_threads (id, user_id, subject, status, unread_admin, unread_user, last_message_at, created_at, updated_at)
     VALUES ($1,$2,'Help','open',FALSE,FALSE,NOW(),NOW(),NOW())
     RETURNING *`,
    [id, userId]
  );
  return rowThread(rows[0]);
}

export async function listUserMessages(threadId: string): Promise<HelpMessage[]> {
  await ensureHelpSchema();
  const { rows } = await getPool().query(
    `SELECT * FROM help_messages WHERE thread_id = $1 ORDER BY created_at ASC`,
    [threadId]
  );
  return rows.map(rowMessage);
}

export async function addHelpMessage(input: {
  threadId: string;
  role: HelpMessageRole;
  content: string;
  authorUserId?: string | null;
  forAdminUnread?: boolean;
  forUserUnread?: boolean;
}): Promise<HelpMessage> {
  await ensureHelpSchema();
  const id = crypto.randomUUID();
  const db = getPool();
  const { rows } = await db.query(
    `INSERT INTO help_messages (id, thread_id, role, author_user_id, content, created_at)
     VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING *`,
    [
      id,
      input.threadId,
      input.role,
      input.authorUserId ?? null,
      input.content.trim(),
    ]
  );
  await db.query(
    `UPDATE help_threads SET
       last_message_at = NOW(),
       updated_at = NOW(),
       unread_admin = CASE WHEN $2 THEN TRUE ELSE unread_admin END,
       unread_user = CASE WHEN $3 THEN TRUE ELSE unread_user END,
       status = CASE
         WHEN $4 = 'user' AND status = 'resolved' THEN 'open'
         WHEN $4 = 'admin' THEN 'waiting'
         ELSE status
       END
     WHERE id = $1`,
    [
      input.threadId,
      Boolean(input.forAdminUnread),
      Boolean(input.forUserUnread),
      input.role,
    ]
  );
  return rowMessage(rows[0]);
}

export async function markThreadReadByUser(threadId: string, userId: string) {
  await ensureHelpSchema();
  await getPool().query(
    `UPDATE help_threads SET unread_user = FALSE, updated_at = NOW()
     WHERE id = $1 AND user_id = $2`,
    [threadId, userId]
  );
}

export async function markThreadReadByAdmin(threadId: string) {
  await ensureHelpSchema();
  await getPool().query(
    `UPDATE help_threads SET unread_admin = FALSE, updated_at = NOW()
     WHERE id = $1`,
    [threadId]
  );
}

export async function listAdminThreads(limit = 50): Promise<HelpThread[]> {
  await ensureHelpSchema();
  const { rows } = await getPool().query(
    `SELECT t.*, u.email, u.name
     FROM help_threads t
     JOIN users u ON u.id = t.user_id
     ORDER BY t.unread_admin DESC, t.last_message_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows.map(rowThread);
}

export async function getThreadById(id: string): Promise<HelpThread | null> {
  await ensureHelpSchema();
  const { rows } = await getPool().query(
    `SELECT t.*, u.email, u.name
     FROM help_threads t
     JOIN users u ON u.id = t.user_id
     WHERE t.id = $1`,
    [id]
  );
  return rows[0] ? rowThread(rows[0]) : null;
}

export async function setThreadStatus(id: string, status: HelpThreadStatus) {
  await ensureHelpSchema();
  await getPool().query(
    `UPDATE help_threads SET status = $2, updated_at = NOW() WHERE id = $1`,
    [id, status]
  );
}

export async function countUnreadAdmin(): Promise<number> {
  await ensureHelpSchema();
  const { rows } = await getPool().query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM help_threads WHERE unread_admin = TRUE`
  );
  return Number(rows[0]?.count ?? 0);
}

export async function listKnowledge(
  includeDisabled = true
): Promise<HelpKnowledgeDoc[]> {
  await ensureHelpSchema();
  const { rows } = await getPool().query(
    includeDisabled
      ? `SELECT * FROM help_knowledge ORDER BY title ASC`
      : `SELECT * FROM help_knowledge WHERE enabled = TRUE ORDER BY title ASC`
  );
  return rows.map(rowKnowledge);
}

export async function upsertKnowledge(input: {
  id?: string;
  title: string;
  body: string;
  tags?: string[];
  enabled?: boolean;
}): Promise<HelpKnowledgeDoc> {
  await ensureHelpSchema();
  const id = input.id ?? crypto.randomUUID();
  const { rows } = await getPool().query(
    `INSERT INTO help_knowledge (id, title, body, tags, enabled, created_at, updated_at)
     VALUES ($1,$2,$3,$4::jsonb,$5,NOW(),NOW())
     ON CONFLICT (id) DO UPDATE SET
       title = EXCLUDED.title,
       body = EXCLUDED.body,
       tags = EXCLUDED.tags,
       enabled = EXCLUDED.enabled,
       updated_at = NOW()
     RETURNING *`,
    [
      id,
      input.title.trim(),
      input.body.trim(),
      JSON.stringify(input.tags ?? []),
      input.enabled !== false,
    ]
  );
  return rowKnowledge(rows[0]);
}

export async function deleteKnowledge(id: string) {
  await ensureHelpSchema();
  await getPool().query(`DELETE FROM help_knowledge WHERE id = $1`, [id]);
}

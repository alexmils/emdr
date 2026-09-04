import { ensureSchemaReady, getPool } from "@/lib/db";

export type UserUsageRow = {
  userId: string;
  email: string;
  name: string | null;
  threadCount: number;
  messageCount: number;
  lastActivityAt: string | null;
};

export async function listUserUsage(limit = 50): Promise<UserUsageRow[]> {
  await ensureSchemaReady();
  const { rows } = await getPool().query<{
    user_id: string;
    email: string;
    name: string | null;
    thread_count: number;
    message_count: number;
    last_activity: string | null;
  }>(
    `SELECT u.id AS user_id, u.email, u.name,
            COUNT(DISTINCT t.id)::int AS thread_count,
            COUNT(m.id)::int AS message_count,
            MAX(GREATEST(t.updated_at, m.created_at)) AS last_activity
     FROM users u
     LEFT JOIN threads t ON t.user_id = u.id
     LEFT JOIN messages m ON m.thread_id = t.id
     GROUP BY u.id, u.email, u.name
     ORDER BY message_count DESC, u.created_at DESC
     LIMIT $1`,
    [limit]
  );

  return rows.map((r) => ({
    userId: r.user_id,
    email: r.email,
    name: r.name,
    threadCount: r.thread_count,
    messageCount: r.message_count,
    lastActivityAt: r.last_activity
      ? new Date(r.last_activity).toISOString()
      : null,
  }));
}

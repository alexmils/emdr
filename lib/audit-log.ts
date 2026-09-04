import { ensureSchemaReady, getPool } from "@/lib/db";

export type AuditAction =
  | "user.login"
  | "user.logout"
  | "user.invited"
  | "user.created"
  | "user.updated"
  | "user.deleted"
  | "user.password_set"
  | "user.disabled"
  | "user.enabled"
  | "settings.platform_updated"
  | "email.test_sent"
  | "email.broadcast_sent";

export type AuditEvent = {
  id: string;
  actorUserId: string | null;
  actorEmail: string | null;
  targetUserId: string | null;
  targetEmail: string | null;
  action: AuditAction;
  detail: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
};

export async function ensureAuditSchema() {
  await ensureSchemaReady();
}

export async function writeAuditEvent(input: {
  actorUserId?: string | null;
  targetUserId?: string | null;
  action: AuditAction;
  detail?: Record<string, unknown>;
  ip?: string | null;
}) {
  await ensureAuditSchema();
  await getPool().query(
    `INSERT INTO audit_events (id, actor_user_id, target_user_id, action, detail, ip, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
    [
      crypto.randomUUID(),
      input.actorUserId ?? null,
      input.targetUserId ?? null,
      input.action,
      input.detail ? JSON.stringify(input.detail) : null,
      input.ip ?? null,
    ]
  );
}

export async function listAuditEvents(options?: {
  limit?: number;
  action?: string;
  search?: string;
  offset?: number;
}): Promise<AuditEvent[]> {
  await ensureAuditSchema();
  const limit = Math.min(200, Math.max(1, options?.limit ?? 100));
  const offset = Math.max(0, options?.offset ?? 0);
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (options?.action) {
    conditions.push(`e.action = $${idx++}`);
    params.push(options.action);
  }
  if (options?.search?.trim()) {
    conditions.push(
      `(ea.email ILIKE $${idx} OR et.email ILIKE $${idx} OR e.action ILIKE $${idx})`
    );
    params.push(`%${options.search.trim()}%`);
    idx++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  params.push(limit, offset);

  const { rows } = await getPool().query<{
    id: string;
    actor_user_id: string | null;
    actor_email: string | null;
    target_user_id: string | null;
    target_email: string | null;
    action: string;
    detail: Record<string, unknown> | null;
    ip: string | null;
    created_at: string;
  }>(
    `SELECT e.id, e.actor_user_id, ea.email AS actor_email,
            e.target_user_id, et.email AS target_email,
            e.action, e.detail, e.ip, e.created_at
     FROM audit_events e
     LEFT JOIN users ea ON ea.id = e.actor_user_id
     LEFT JOIN users et ON et.id = e.target_user_id
     ORDER BY e.created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    params
  );

  return rows.map((r) => ({
    id: r.id,
    actorUserId: r.actor_user_id,
    actorEmail: r.actor_email,
    targetUserId: r.target_user_id,
    targetEmail: r.target_email,
    action: r.action as AuditAction,
    detail: r.detail,
    ip: r.ip,
    createdAt: new Date(r.created_at).toISOString(),
  }));
}

export async function recordUserLogin(userId: string, ip?: string | null) {
  await ensureAuditSchema();
  await getPool().query(
    "UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1",
    [userId]
  );
  await writeAuditEvent({
    actorUserId: userId,
    targetUserId: userId,
    action: "user.login",
    ip,
  });
}

export function clientIp(request: Request): string | null {
  const trustProxy =
    process.env.TRUST_PROXY === "1" || process.env.TRUST_PROXY === "true";
  if (trustProxy) {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
    const realIp = request.headers.get("x-real-ip");
    if (realIp) return realIp.trim();
  }
  return null;
}

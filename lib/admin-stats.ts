import { ensureSchemaReady, getPool } from "@/lib/db";

export type AdminDashboardStats = {
  users: {
    total: number;
    newThisMonth: number;
    admins: number;
  };
  sessions: {
    totalThreads: number;
    messagesThisMonth: number;
  };
  billing: {
    activePaid: number;
    mrrCents: number;
    currency: string;
  };
};

export type AdminUserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
  plan: string;
  subscriptionStatus: string;
  amountCents: number;
};

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  await ensureSchemaReady();
  const pool = getPool();

  const [users, admins, newUsers, threads, messages, billing] =
    await Promise.all([
      pool.query<{ c: number }>("SELECT COUNT(*)::int AS c FROM users"),
      pool.query<{ c: number }>(
        "SELECT COUNT(*)::int AS c FROM users WHERE role = 'platform_admin'"
      ),
      pool.query<{ c: number }>(
        "SELECT COUNT(*)::int AS c FROM users WHERE created_at >= date_trunc('month', NOW())"
      ),
      pool.query<{ c: number }>("SELECT COUNT(*)::int AS c FROM threads"),
      pool.query<{ c: number }>(
        "SELECT COUNT(*)::int AS c FROM messages WHERE created_at >= date_trunc('month', NOW())"
      ),
      pool.query<{ active_paid: number; mrr_cents: number }>(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'active' AND plan <> 'free')::int AS active_paid,
          COALESCE(SUM(amount_cents) FILTER (WHERE status = 'active' AND plan <> 'free'), 0)::int AS mrr_cents
        FROM subscriptions
      `),
    ]);

  return {
    users: {
      total: users.rows[0]?.c ?? 0,
      newThisMonth: newUsers.rows[0]?.c ?? 0,
      admins: admins.rows[0]?.c ?? 0,
    },
    sessions: {
      totalThreads: threads.rows[0]?.c ?? 0,
      messagesThisMonth: messages.rows[0]?.c ?? 0,
    },
    billing: {
      activePaid: billing.rows[0]?.active_paid ?? 0,
      mrrCents: billing.rows[0]?.mrr_cents ?? 0,
      currency: "EUR",
    },
  };
}

export async function listAdminUsers(limit = 50): Promise<AdminUserRow[]> {
  await ensureSchemaReady();
  const { rows } = await getPool().query<{
    id: string;
    email: string;
    name: string | null;
    role: string;
    status: string;
    created_at: string;
    last_login_at: string | null;
    plan: string | null;
    subscription_status: string | null;
    amount_cents: number | null;
  }>(
    `SELECT u.id, u.email, u.name, u.role, u.status, u.created_at, u.last_login_at,
            COALESCE(s.plan, 'free') AS plan,
            COALESCE(s.status, 'none') AS subscription_status,
            COALESCE(s.amount_cents, 0) AS amount_cents
     FROM users u
     LEFT JOIN subscriptions s ON s.user_id = u.id
     ORDER BY u.created_at DESC
     LIMIT $1`,
    [limit]
  );

  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    name: r.name,
    role: r.role,
    status: r.status ?? "active",
    createdAt: new Date(r.created_at).toISOString(),
    lastLoginAt: r.last_login_at
      ? new Date(r.last_login_at).toISOString()
      : null,
    plan: r.plan ?? "free",
    subscriptionStatus: r.subscription_status ?? "none",
    amountCents: r.amount_cents ?? 0,
  }));
}

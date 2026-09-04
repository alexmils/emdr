import { ensureSchemaReady, getPool } from "@/lib/db";
import { getUserById } from "@/lib/users";
import type { UserStatus } from "@/lib/users";

export type AdminUserDetail = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: UserStatus;
  createdAt: string;
  lastLoginAt: string | null;
  emailVerified: boolean;
  hasPassword: boolean;
  plan: string;
  subscriptionStatus: string;
  amountCents: number;
  threadCount: number;
  messageCount: number;
};

export async function getAdminUserDetail(
  userId: string
): Promise<AdminUserDetail | null> {
  await ensureSchemaReady();
  const user = await getUserById(userId);
  if (!user) return null;

  const pool = getPool();
  const [threads, messages, sub] = await Promise.all([
    pool.query<{ c: number }>(
      "SELECT COUNT(*)::int AS c FROM threads WHERE user_id = $1",
      [userId]
    ),
    pool.query<{ c: number }>(
      `SELECT COUNT(*)::int AS c FROM messages m
       JOIN threads t ON t.id = m.thread_id
       WHERE t.user_id = $1`,
      [userId]
    ),
    pool.query<{
      plan: string | null;
      status: string | null;
      amount_cents: number | null;
    }>(
      `SELECT plan, status, amount_cents FROM subscriptions WHERE user_id = $1`,
      [userId]
    ),
  ]);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    emailVerified: user.emailVerified,
    hasPassword: Boolean(user.passwordHash),
    plan: sub.rows[0]?.plan ?? "free",
    subscriptionStatus: sub.rows[0]?.status ?? "none",
    amountCents: sub.rows[0]?.amount_cents ?? 0,
    threadCount: threads.rows[0]?.c ?? 0,
    messageCount: messages.rows[0]?.c ?? 0,
  };
}

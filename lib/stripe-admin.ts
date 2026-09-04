import { ensureSchemaReady, getPool } from "@/lib/db";

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() &&
      process.env.STRIPE_WEBHOOK_SECRET?.trim()
  );
}

export async function syncSubscriptionFromStripe(input: {
  userId: string;
  plan: string;
  status: string;
  amountCents: number;
  currency?: string;
  renewsAt?: string | null;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}) {
  await ensureSchemaReady();
  await getPool().query(
    `INSERT INTO subscriptions (user_id, plan, status, amount_cents, currency, renews_at, stripe_customer_id, stripe_subscription_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       plan = EXCLUDED.plan,
       status = EXCLUDED.status,
       amount_cents = EXCLUDED.amount_cents,
       currency = EXCLUDED.currency,
       renews_at = EXCLUDED.renews_at,
       stripe_customer_id = EXCLUDED.stripe_customer_id,
       stripe_subscription_id = EXCLUDED.stripe_subscription_id,
       updated_at = NOW()`,
    [
      input.userId,
      input.plan,
      input.status,
      input.amountCents,
      input.currency ?? "EUR",
      input.renewsAt ?? null,
      input.stripeCustomerId ?? null,
      input.stripeSubscriptionId ?? null,
    ]
  );
}

export type AdminBillingRow = {
  userId: string;
  email: string;
  name: string | null;
  plan: string;
  status: string;
  amountCents: number;
  currency: string;
  renewsAt: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
};

export async function listAdminBilling(limit = 100): Promise<AdminBillingRow[]> {
  await ensureSchemaReady();
  const { rows } = await getPool().query<{
    user_id: string;
    email: string;
    name: string | null;
    plan: string;
    status: string;
    amount_cents: number;
    currency: string;
    renews_at: string | null;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
  }>(
    `SELECT u.id AS user_id, u.email, u.name,
            COALESCE(s.plan, 'free') AS plan,
            COALESCE(s.status, 'none') AS status,
            COALESCE(s.amount_cents, 0) AS amount_cents,
            COALESCE(s.currency, 'EUR') AS currency,
            s.renews_at,
            s.stripe_customer_id,
            s.stripe_subscription_id
     FROM users u
     LEFT JOIN subscriptions s ON s.user_id = u.id
     ORDER BY s.amount_cents DESC NULLS LAST, u.created_at DESC
     LIMIT $1`,
    [limit]
  );

  return rows.map((r) => ({
    userId: r.user_id,
    email: r.email,
    name: r.name,
    plan: r.plan,
    status: r.status,
    amountCents: r.amount_cents,
    currency: r.currency,
    renewsAt: r.renews_at ? new Date(r.renews_at).toISOString() : null,
    stripeCustomerId: r.stripe_customer_id,
    stripeSubscriptionId: r.stripe_subscription_id,
  }));
}

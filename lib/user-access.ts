import { ensureSchemaReady, getPool } from "@/lib/db";

/**
 * Ensure every ordinary user has an explicit subscriptions row.
 * New consumers start at access_tier=none until Stripe checkout succeeds.
 */
export async function ensureUserAccessStub(userId: string): Promise<void> {
  await ensureSchemaReady();
  await getPool().query(
    `INSERT INTO subscriptions (
       user_id, plan, status, amount_cents, currency, access_tier, created_at, updated_at
     )
     VALUES ($1, 'free', 'none', 0, 'EUR', 'none', NOW(), NOW())
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );
  await getPool().query(
    `INSERT INTO trial_usage (user_id, guided_sessions_used, bls_seconds_used, updated_at)
     VALUES ($1, 0, 0, NOW())
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );
}

/**
 * Admin-invited users get legacy access (no Stripe) once they set a password.
 * Does not overwrite an existing Stripe-backed subscription.
 */
export async function grantInvitedUserLegacyAccess(userId: string): Promise<void> {
  await ensureSchemaReady();
  const db = getPool();
  await db.query(
    `UPDATE users
     SET onboarding_completed_at = COALESCE(onboarding_completed_at, NOW()),
         updated_at = NOW()
     WHERE id = $1`,
    [userId]
  );
  await db.query(
    `INSERT INTO subscriptions (
       user_id, plan, status, amount_cents, currency, access_tier, created_at, updated_at
     )
     VALUES ($1, 'legacy', 'legacy', 0, 'EUR', 'legacy', NOW(), NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       plan = CASE
         WHEN subscriptions.stripe_subscription_id IS NULL THEN 'legacy'
         ELSE subscriptions.plan
       END,
       status = CASE
         WHEN subscriptions.stripe_subscription_id IS NULL THEN 'legacy'
         ELSE subscriptions.status
       END,
       access_tier = CASE
         WHEN subscriptions.stripe_subscription_id IS NULL THEN 'legacy'
         ELSE subscriptions.access_tier
       END,
       updated_at = NOW()`,
    [userId]
  );
  await db.query(
    `INSERT INTO trial_usage (user_id, guided_sessions_used, bls_seconds_used, updated_at)
     VALUES ($1, 0, 0, NOW())
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );
}

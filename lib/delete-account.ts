import { ensureSchemaReady, getPool } from "@/lib/db";
import { getSubscriptionByUserId } from "@/lib/stripe-admin";
import { resolveStripeClient } from "@/lib/stripe";
import { getUserById, type User } from "@/lib/users";

/** Confirm typed email matches the account (case-insensitive). */
export function emailsMatchForDeletion(
  confirmEmail: string,
  accountEmail: string
): boolean {
  return (
    confirmEmail.trim().toLowerCase() === accountEmail.trim().toLowerCase()
  );
}

async function cancelStripeSubscriptionBestEffort(userId: string): Promise<{
  attempted: boolean;
  canceled: boolean;
  error?: string;
}> {
  const sub = await getSubscriptionByUserId(userId);
  const subId = sub?.stripe_subscription_id?.trim();
  if (!subId) {
    return { attempted: false, canceled: false };
  }

  try {
    const resolved = await resolveStripeClient({
      livemode:
        typeof sub.stripe_livemode === "boolean" ? sub.stripe_livemode : null,
      objectId: subId,
    });
    if (!resolved) {
      return {
        attempted: true,
        canceled: false,
        error: "Stripe client unavailable",
      };
    }
    await resolved.stripe.subscriptions.cancel(subId);
    return { attempted: true, canceled: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe cancel failed";
    console.error("[delete-account] Stripe cancel", err);
    return { attempted: true, canceled: false, error: message };
  }
}

/**
 * Permanently delete a signed-in user's account and cascaded app data.
 * Cancels Stripe subscription when possible (best-effort; deletion still proceeds).
 */
export async function deleteOwnAccount(
  userId: string
): Promise<
  | { ok: true; user: User; stripe: { attempted: boolean; canceled: boolean } }
  | { error: string }
> {
  await ensureSchemaReady();

  const user = await getUserById(userId);
  if (!user) return { error: "User not found" };

  if (user.role === "platform_admin") {
    const { rows } = await getPool().query<{ c: number }>(
      "SELECT COUNT(*)::int AS c FROM users WHERE role = 'platform_admin'"
    );
    if ((rows[0]?.c ?? 0) <= 1) {
      return {
        error:
          "Cannot delete the last platform admin. Promote another admin first.",
      };
    }
  }

  const stripe = await cancelStripeSubscriptionBestEffort(userId);

  await getPool().query("DELETE FROM users WHERE id = $1", [userId]);

  return { ok: true, user, stripe };
}

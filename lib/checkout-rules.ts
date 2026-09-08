/** Pure helpers for checkout entitlement rules (unit-tested). */

const BLOCKING_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "incomplete",
]);

export function hasBlockingStripeSubscription(input: {
  stripeSubscriptionId?: string | null;
  status?: string | null;
}): boolean {
  return Boolean(
    input.stripeSubscriptionId &&
      input.status &&
      BLOCKING_STATUSES.has(input.status)
  );
}

export function shouldIncludeCheckoutTrial(input: {
  isTrialLimited: boolean;
  accessTier: string;
  guidedUsed: number;
  status?: string | null;
  stripeSubscriptionId?: string | null;
}): boolean {
  if (input.isTrialLimited) return false;
  if (input.accessTier === "active") return false;
  if (input.guidedUsed > 0) return false;
  if (input.stripeSubscriptionId) return false;
  if (
    input.status === "canceled" ||
    input.status === "past_due" ||
    input.status === "unpaid" ||
    input.status === "incomplete"
  ) {
    return false;
  }
  return true;
}

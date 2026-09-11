/** Pure helpers for checkout entitlement rules (unit-tested). */

const BLOCKING_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "incomplete",
]);

const PORTAL_STATUSES = new Set([
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

export function shouldOfferBillingPortal(input: {
  status?: string | null;
}): boolean {
  return Boolean(input.status && PORTAL_STATUSES.has(input.status));
}

/**
 * Prevent an old Checkout success URL from overwriting a newer live subscription.
 */
export function shouldApplyCheckoutSessionSync(input: {
  existingSubscriptionId?: string | null;
  existingStatus?: string | null;
  incomingSubscriptionId: string;
}): boolean {
  if (!input.existingSubscriptionId) return true;
  if (input.existingSubscriptionId === input.incomingSubscriptionId) return true;
  const live =
    input.existingStatus === "active" || input.existingStatus === "trialing";
  return !live;
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

/** Trial and plan constants for consumer billing. */

export const TRIAL_DAYS = 7;
export const TRIAL_GUIDED_SESSIONS = 3;
/** Total Free/BLS seconds during trial (10 minutes). */
export const TRIAL_BLS_SECONDS = 600;

export type BillingPlanId = "monthly" | "yearly";

export const BILLING_PLANS: Record<
  BillingPlanId,
  {
    id: BillingPlanId;
    label: string;
    interval: "month" | "year";
    /** Display-only; Stripe Price ID comes from env. */
    displayPrice: string;
    displayPeriod: string;
    highlight?: boolean;
    savingsHint?: string;
  }
> = {
  yearly: {
    id: "yearly",
    label: "Yearly",
    interval: "year",
    displayPrice: "€99",
    displayPeriod: "/year",
    highlight: true,
    savingsHint: "Best value",
  },
  monthly: {
    id: "monthly",
    label: "Monthly",
    interval: "month",
    displayPrice: "€14.99",
    displayPeriod: "/month",
  },
};

export function isBillingPlanId(value: unknown): value is BillingPlanId {
  return value === "monthly" || value === "yearly";
}

export function stripePriceIdForPlan(plan: BillingPlanId): string | null {
  const monthly = process.env.STRIPE_PRICE_ID_MONTHLY?.trim();
  const yearly = process.env.STRIPE_PRICE_ID_YEARLY?.trim();
  // Legacy single-price fallback maps to monthly.
  const legacy = process.env.STRIPE_PRICE_ID?.trim();
  if (plan === "yearly") return yearly || null;
  return monthly || legacy || null;
}

export function planIdFromStripePriceId(priceId: string | null | undefined): BillingPlanId | "pro" {
  if (!priceId) return "pro";
  const yearly = process.env.STRIPE_PRICE_ID_YEARLY?.trim();
  const monthly = process.env.STRIPE_PRICE_ID_MONTHLY?.trim() || process.env.STRIPE_PRICE_ID?.trim();
  if (yearly && priceId === yearly) return "yearly";
  if (monthly && priceId === monthly) return "monthly";
  return "pro";
}

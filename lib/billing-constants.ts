/** Trial and plan constants for consumer billing. */

export const TRIAL_DAYS = 7;
export const TRIAL_GUIDED_SESSIONS = 3;
/** Total Free/BLS seconds during trial (10 minutes). */
export const TRIAL_BLS_SECONDS = 600;

export type BillingPlanId = "weekly" | "monthly" | "yearly";

export type BillingPlanMeta = {
  id: BillingPlanId;
  label: string;
  interval: "week" | "month" | "year";
  /** Display-only; Stripe Price ID comes from admin settings. */
  displayPrice: string;
  displayPeriod: string;
  highlight?: boolean;
  savingsHint?: string;
};

export type StripePriceIds = {
  weekly?: string | null;
  monthly?: string | null;
  yearly?: string | null;
};

export const BILLING_PLANS: Record<BillingPlanId, BillingPlanMeta> = {
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
  weekly: {
    id: "weekly",
    label: "Weekly",
    interval: "week",
    displayPrice: "€4.99",
    displayPeriod: "/week",
  },
};

/** Stable UI order: yearly (best value) → monthly → weekly. */
export const BILLING_PLAN_ORDER: BillingPlanId[] = [
  "yearly",
  "monthly",
  "weekly",
];

export function orderedBillingPlans(
  plans: Record<BillingPlanId, BillingPlanMeta>
): BillingPlanMeta[] {
  return BILLING_PLAN_ORDER.map((id) => plans[id]).filter(Boolean);
}

export function isBillingPlanId(value: unknown): value is BillingPlanId {
  return value === "weekly" || value === "monthly" || value === "yearly";
}

/** Overlay admin display prices onto default plan metadata. */
export function billingPlansFromConfig(prices: {
  weeklyDisplay?: string;
  monthlyDisplay?: string;
  yearlyDisplay?: string;
}): Record<BillingPlanId, BillingPlanMeta> {
  return {
    yearly: {
      ...BILLING_PLANS.yearly,
      displayPrice:
        prices.yearlyDisplay?.trim() || BILLING_PLANS.yearly.displayPrice,
    },
    monthly: {
      ...BILLING_PLANS.monthly,
      displayPrice:
        prices.monthlyDisplay?.trim() || BILLING_PLANS.monthly.displayPrice,
    },
    weekly: {
      ...BILLING_PLANS.weekly,
      displayPrice:
        prices.weeklyDisplay?.trim() || BILLING_PLANS.weekly.displayPrice,
    },
  };
}

export function stripePriceIdForPlan(
  plan: BillingPlanId,
  ids: StripePriceIds
): string | null {
  if (plan === "yearly") return ids.yearly?.trim() || null;
  if (plan === "weekly") return ids.weekly?.trim() || null;
  return ids.monthly?.trim() || null;
}

export function planIdFromStripePriceId(
  priceId: string | null | undefined,
  ids: StripePriceIds
): BillingPlanId | "pro" {
  if (!priceId) return "pro";
  const weekly = ids.weekly?.trim();
  const yearly = ids.yearly?.trim();
  const monthly = ids.monthly?.trim();
  if (weekly && priceId === weekly) return "weekly";
  if (yearly && priceId === yearly) return "yearly";
  if (monthly && priceId === monthly) return "monthly";
  return "pro";
}

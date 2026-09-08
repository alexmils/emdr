import Stripe from "stripe";
import {
  getPlatformSettings,
  type PlatformStripeConfig,
} from "@/lib/platform-settings";
import {
  billingPlansFromConfig,
  stripePriceIdForPlan,
  type BillingPlanId,
  type BillingPlanMeta,
  type StripePriceIds,
} from "@/lib/billing-constants";

let client: Stripe | null = null;
let clientKey = "";

export async function getStripeConfig(): Promise<PlatformStripeConfig> {
  const settings = await getPlatformSettings();
  return settings.stripe;
}

export function stripePriceIdsFromConfig(
  cfg: PlatformStripeConfig
): StripePriceIds {
  return {
    weekly: cfg.priceIdWeekly,
    monthly: cfg.priceIdMonthly,
    yearly: cfg.priceIdYearly,
  };
}

export function resolveBillingPlans(
  cfg: PlatformStripeConfig
): Record<BillingPlanId, BillingPlanMeta> {
  const all = billingPlansFromConfig({
    weeklyDisplay: cfg.displayPriceWeekly,
    monthlyDisplay: cfg.displayPriceMonthly,
    yearlyDisplay: cfg.displayPriceYearly,
  });
  const out = {} as Record<BillingPlanId, BillingPlanMeta>;
  for (const id of Object.keys(all) as BillingPlanId[]) {
    const priceId = stripePriceIdForPlan(id, stripePriceIdsFromConfig(cfg));
    if (priceId) out[id] = all[id];
  }
  // If nothing configured yet, still show defaults so Admin UI / empty state isn't blank.
  return Object.keys(out).length > 0 ? out : all;
}

export async function getStripe(): Promise<Stripe | null> {
  const cfg = await getStripeConfig();
  const key = cfg.secretKey.trim();
  if (!key) return null;
  if (!client || clientKey !== key) {
    client = new Stripe(key, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
    clientKey = key;
  }
  return client;
}

export async function requireStripe(): Promise<Stripe> {
  const stripe = await getStripe();
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }
  return stripe;
}

export async function isStripeConfigured(): Promise<boolean> {
  const cfg = await getStripeConfig();
  return Boolean(
    cfg.secretKey.trim() &&
      cfg.webhookSecret.trim() &&
      (cfg.priceIdMonthly.trim() ||
        cfg.priceIdWeekly.trim() ||
        cfg.priceIdYearly.trim())
  );
}

export async function priceIdForPlan(
  plan: BillingPlanId
): Promise<string | null> {
  const cfg = await getStripeConfig();
  return stripePriceIdForPlan(plan, stripePriceIdsFromConfig(cfg));
}

/** Clear cached Stripe client after admin key change. */
export function resetStripeClient(): void {
  client = null;
  clientKey = "";
}

export function randomIntegrationSuffix(length = 8): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

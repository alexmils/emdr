import Stripe from "stripe";
import {
  getPlatformSettings,
  type PlatformStripeConfig,
} from "@/lib/platform-settings";
import {
  activeStripeCredentials,
  type StripeCredentialSet,
} from "@/lib/stripe-config";
import {
  billingPlansFromConfig,
  stripePriceIdForPlan,
  type BillingPlanId,
  type BillingPlanMeta,
  type StripePriceIds,
} from "@/lib/billing-constants";

/** One client per secret key — safe for concurrent sandbox + live use. */
const clients = new Map<string, Stripe>();

export async function getStripeConfig(): Promise<PlatformStripeConfig> {
  const settings = await getPlatformSettings();
  return settings.stripe;
}

export function stripePriceIdsFromConfig(
  cfg: StripeCredentialSet | PlatformStripeConfig
): StripePriceIds {
  const creds =
    "sandbox" in cfg ? activeStripeCredentials(cfg) : (cfg as StripeCredentialSet);
  return {
    weekly: creds.priceIdWeekly,
    monthly: creds.priceIdMonthly,
    yearly: creds.priceIdYearly,
  };
}

export function resolveBillingPlans(
  cfg: PlatformStripeConfig | StripeCredentialSet
): Record<BillingPlanId, BillingPlanMeta> {
  const creds =
    "sandbox" in cfg ? activeStripeCredentials(cfg) : (cfg as StripeCredentialSet);
  const all = billingPlansFromConfig({
    weeklyDisplay: creds.displayPriceWeekly,
    monthlyDisplay: creds.displayPriceMonthly,
    yearlyDisplay: creds.displayPriceYearly,
  });
  const out = {} as Record<BillingPlanId, BillingPlanMeta>;
  for (const id of Object.keys(all) as BillingPlanId[]) {
    const priceId = stripePriceIdForPlan(id, stripePriceIdsFromConfig(creds));
    if (priceId) out[id] = all[id];
  }
  return Object.keys(out).length > 0 ? out : all;
}

function clientForKey(key: string): Stripe | null {
  const trimmed = key.trim();
  if (!trimmed) return null;
  let existing = clients.get(trimmed);
  if (!existing) {
    existing = new Stripe(trimmed, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
    clients.set(trimmed, existing);
  }
  return existing;
}

/**
 * Infer livemode from IDs that encode it (cs_test_ / cs_live_, sk_test_, …).
 * Returns null for opaque ids (cus_, sub_, price_).
 */
export function inferLivemodeFromStripeId(id: string): boolean | null {
  const v = id.trim();
  if (!v) return null;
  if (
    /_test_/.test(v) ||
    v.startsWith("sk_test") ||
    v.startsWith("pk_test") ||
    v.startsWith("rk_test")
  ) {
    return false;
  }
  if (
    /_live_/.test(v) ||
    v.startsWith("sk_live") ||
    v.startsWith("pk_live") ||
    v.startsWith("rk_live")
  ) {
    return true;
  }
  return null;
}

/** Stripe client for the active demo/live mode (new Checkout). */
export async function getStripe(): Promise<Stripe | null> {
  const cfg = await getStripeConfig();
  return clientForKey(activeStripeCredentials(cfg).secretKey);
}

/** Stripe client for a specific livemode (webhooks / existing customers). */
export async function getStripeForLivemode(
  livemode: boolean
): Promise<Stripe | null> {
  const cfg = await getStripeConfig();
  const key = livemode ? cfg.live.secretKey : cfg.sandbox.secretKey;
  return clientForKey(key);
}

async function probeObjectOnAccount(
  stripe: Stripe,
  objectId: string
): Promise<boolean> {
  try {
    if (objectId.startsWith("cus_")) {
      await stripe.customers.retrieve(objectId);
      return true;
    }
    if (objectId.startsWith("sub_")) {
      await stripe.subscriptions.retrieve(objectId);
      return true;
    }
    if (objectId.startsWith("cs_")) {
      await stripe.checkout.sessions.retrieve(objectId);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Resolve the Stripe client that owns a stored customer/subscription/session.
 * Prefer explicit livemode, then ID hints, then probe both accounts.
 */
export async function resolveStripeClient(opts: {
  livemode?: boolean | null;
  objectId?: string | null;
}): Promise<{ stripe: Stripe; livemode: boolean } | null> {
  const fromId =
    typeof opts.livemode === "boolean"
      ? opts.livemode
      : opts.objectId
        ? inferLivemodeFromStripeId(opts.objectId)
        : null;

  if (typeof fromId === "boolean") {
    const stripe = await getStripeForLivemode(fromId);
    return stripe ? { stripe, livemode: fromId } : null;
  }

  if (opts.objectId?.trim()) {
    const id = opts.objectId.trim();
    // Prefer active env first (common case), then the other.
    const cfg = await getStripeConfig();
    const preferred = cfg.demoMode !== false ? false : true;
    const order = [preferred, !preferred] as const;
    for (const livemode of order) {
      const stripe = await getStripeForLivemode(livemode);
      if (!stripe) continue;
      if (await probeObjectOnAccount(stripe, id)) {
        return { stripe, livemode };
      }
    }
    return null;
  }

  const stripe = await getStripe();
  if (!stripe) return null;
  const cfg = await getStripeConfig();
  return { stripe, livemode: cfg.demoMode === false };
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
  const active = activeStripeCredentials(cfg);
  return Boolean(
    active.secretKey.trim() &&
      active.webhookSecret.trim() &&
      (active.priceIdMonthly.trim() ||
        active.priceIdWeekly.trim() ||
        active.priceIdYearly.trim())
  );
}

export async function priceIdForPlan(
  plan: BillingPlanId
): Promise<string | null> {
  const cfg = await getStripeConfig();
  return stripePriceIdForPlan(plan, stripePriceIdsFromConfig(cfg));
}

export async function isStripeDemoMode(): Promise<boolean> {
  const cfg = await getStripeConfig();
  return cfg.demoMode !== false;
}

/** Active Checkout livemode: demo → test (false), live → true. */
export async function activeStripeLivemode(): Promise<boolean> {
  return !(await isStripeDemoMode());
}

/** Clear cached Stripe clients after admin key / mode change. */
export function resetStripeClient(): void {
  clients.clear();
}

export function randomIntegrationSuffix(length = 8): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

/** One Stripe environment (sandbox/test or live). */
export type StripeCredentialSet = {
  secretKey: string;
  webhookSecret: string;
  publishableKey: string;
  priceIdWeekly: string;
  priceIdMonthly: string;
  priceIdYearly: string;
  displayPriceWeekly: string;
  displayPriceMonthly: string;
  displayPriceYearly: string;
};

/**
 * Stripe billing config — Admin → Billing.
 * `demoMode` true → sandbox credentials (test keys).
 * `demoMode` false → live credentials (real charges).
 */
export type PlatformStripeConfig = {
  demoMode: boolean;
  sandbox: StripeCredentialSet;
  live: StripeCredentialSet;
};

export const DEFAULT_STRIPE_CREDENTIALS: StripeCredentialSet = {
  secretKey: "",
  webhookSecret: "",
  publishableKey: "",
  priceIdWeekly: "",
  priceIdMonthly: "",
  priceIdYearly: "",
  displayPriceWeekly: "$4.99",
  displayPriceMonthly: "$14.99",
  displayPriceYearly: "$99",
};

/** Catalog is USD; rewrite leftover euro display strings from older admin saves. */
function displayPriceAsUsd(raw: unknown, fallback: string): string {
  const v =
    typeof raw === "string" && raw.trim() ? raw.trim() : fallback.trim();
  return v.replace(/^€\s?/, "$");
}

export const DEFAULT_PLATFORM_STRIPE: PlatformStripeConfig = {
  demoMode: true,
  sandbox: { ...DEFAULT_STRIPE_CREDENTIALS },
  live: { ...DEFAULT_STRIPE_CREDENTIALS },
};

export function activeStripeEnv(
  cfg: PlatformStripeConfig
): "sandbox" | "live" {
  return cfg.demoMode ? "sandbox" : "live";
}

/** Credentials used for Checkout / Portal / activate based on demoMode. */
export function activeStripeCredentials(
  cfg: PlatformStripeConfig
): StripeCredentialSet {
  return cfg.demoMode ? cfg.sandbox : cfg.live;
}

export function normalizeStripeCredentialSet(
  raw: unknown,
  fallback: StripeCredentialSet = DEFAULT_STRIPE_CREDENTIALS
): StripeCredentialSet {
  const r =
    raw && typeof raw === "object"
      ? (raw as Partial<StripeCredentialSet>)
      : {};
  const str = (v: unknown, fb: string) =>
    typeof v === "string" && v.trim() ? v.trim() : fb;
  return {
    secretKey: str(r.secretKey, fallback.secretKey),
    webhookSecret: str(r.webhookSecret, fallback.webhookSecret),
    publishableKey: str(r.publishableKey, fallback.publishableKey),
    priceIdWeekly: str(r.priceIdWeekly, fallback.priceIdWeekly),
    priceIdMonthly: str(r.priceIdMonthly, fallback.priceIdMonthly),
    priceIdYearly: str(r.priceIdYearly, fallback.priceIdYearly),
    displayPriceWeekly: displayPriceAsUsd(
      r.displayPriceWeekly,
      fallback.displayPriceWeekly || DEFAULT_STRIPE_CREDENTIALS.displayPriceWeekly
    ),
    displayPriceMonthly: displayPriceAsUsd(
      r.displayPriceMonthly,
      fallback.displayPriceMonthly ||
        DEFAULT_STRIPE_CREDENTIALS.displayPriceMonthly
    ),
    displayPriceYearly: displayPriceAsUsd(
      r.displayPriceYearly,
      fallback.displayPriceYearly || DEFAULT_STRIPE_CREDENTIALS.displayPriceYearly
    ),
  };
}

/** Migrate legacy flat stripe blob → sandbox + live. */
export function normalizeStripeConfig(raw: unknown): PlatformStripeConfig {
  if (!raw || typeof raw !== "object") {
    return {
      demoMode: true,
      sandbox: { ...DEFAULT_STRIPE_CREDENTIALS },
      live: { ...DEFAULT_STRIPE_CREDENTIALS },
    };
  }
  const r = raw as Partial<PlatformStripeConfig> &
    Partial<StripeCredentialSet> & {
      sandbox?: unknown;
      live?: unknown;
      demoMode?: unknown;
    };

  const hasNested =
    (r.sandbox && typeof r.sandbox === "object") ||
    (r.live && typeof r.live === "object");

  if (hasNested) {
    return {
      demoMode: r.demoMode !== false,
      sandbox: normalizeStripeCredentialSet(
        r.sandbox,
        DEFAULT_STRIPE_CREDENTIALS
      ),
      live: normalizeStripeCredentialSet(r.live, DEFAULT_STRIPE_CREDENTIALS),
    };
  }

  // Legacy flat keys → sandbox (current test setup).
  const migrated = normalizeStripeCredentialSet(r, DEFAULT_STRIPE_CREDENTIALS);
  return {
    demoMode: true,
    sandbox: migrated,
    live: { ...DEFAULT_STRIPE_CREDENTIALS },
  };
}

export function stripeFromEnvFallback(
  current: PlatformStripeConfig
): PlatformStripeConfig {
  const env = (k: string) => process.env[k]?.trim() || "";
  const pick = (cur: string, envKey: string) => cur || env(envKey);

  const sandbox: StripeCredentialSet = {
    ...current.sandbox,
    secretKey: pick(current.sandbox.secretKey, "STRIPE_SECRET_KEY"),
    webhookSecret: pick(
      current.sandbox.webhookSecret,
      "STRIPE_WEBHOOK_SECRET"
    ),
    publishableKey: pick(
      current.sandbox.publishableKey,
      "STRIPE_PUBLISHABLE_KEY"
    ),
    priceIdWeekly: pick(
      current.sandbox.priceIdWeekly,
      "STRIPE_PRICE_ID_WEEKLY"
    ),
    priceIdMonthly:
      pick(current.sandbox.priceIdMonthly, "STRIPE_PRICE_ID_MONTHLY") ||
      pick("", "STRIPE_PRICE_ID"),
    priceIdYearly: pick(
      current.sandbox.priceIdYearly,
      "STRIPE_PRICE_ID_YEARLY"
    ),
  };

  const live: StripeCredentialSet = {
    ...current.live,
    secretKey: pick(current.live.secretKey, "STRIPE_LIVE_SECRET_KEY"),
    webhookSecret: pick(
      current.live.webhookSecret,
      "STRIPE_LIVE_WEBHOOK_SECRET"
    ),
    publishableKey: pick(
      current.live.publishableKey,
      "STRIPE_LIVE_PUBLISHABLE_KEY"
    ),
    priceIdWeekly: pick(
      current.live.priceIdWeekly,
      "STRIPE_LIVE_PRICE_ID_WEEKLY"
    ),
    priceIdMonthly: pick(
      current.live.priceIdMonthly,
      "STRIPE_LIVE_PRICE_ID_MONTHLY"
    ),
    priceIdYearly: pick(
      current.live.priceIdYearly,
      "STRIPE_LIVE_PRICE_ID_YEARLY"
    ),
  };

  return {
    demoMode: current.demoMode !== false,
    sandbox,
    live,
  };
}

export function isStripeCredentialSetEmpty(set: StripeCredentialSet): boolean {
  return (
    !set.secretKey.trim() &&
    !set.webhookSecret.trim() &&
    !set.priceIdMonthly.trim() &&
    !set.priceIdWeekly.trim() &&
    !set.priceIdYearly.trim()
  );
}

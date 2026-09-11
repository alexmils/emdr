import type {
  PlatformStripeConfig,
  StripeCredentialSet,
} from "@/lib/stripe-config";
import {
  DEFAULT_PLATFORM_STRIPE,
  DEFAULT_STRIPE_CREDENTIALS,
  activeStripeCredentials,
  activeStripeEnv,
} from "@/lib/stripe-config";

export type StripeEnvAdminView = StripeCredentialSet & {
  hasSecretKey: boolean;
  hasWebhookSecret: boolean;
};

/** Admin GET payload — secrets only for platform_admin. */
export type StripeAdminView = {
  demoMode: boolean;
  activeEnv: "sandbox" | "live";
  sandbox: StripeEnvAdminView;
  live: StripeEnvAdminView;
};

export function stripeAdminStatus(cfg: PlatformStripeConfig): {
  catalogReady: boolean;
  webhookReady: boolean;
  stripeConfigured: boolean;
  demoMode: boolean;
  activeEnv: "sandbox" | "live";
} {
  const active = activeStripeCredentials(cfg);
  const catalogReady = Boolean(
    active.secretKey.trim() &&
      (active.priceIdWeekly.trim() ||
        active.priceIdMonthly.trim() ||
        active.priceIdYearly.trim())
  );
  const webhookReady = Boolean(active.webhookSecret.trim());
  return {
    catalogReady,
    webhookReady,
    stripeConfigured: catalogReady && webhookReady,
    demoMode: cfg.demoMode !== false,
    activeEnv: activeStripeEnv(cfg),
  };
}

function toEnvView(
  set: StripeCredentialSet,
  _canEdit: boolean
): StripeEnvAdminView {
  // Secrets are write-only: never echo them back in GET responses.
  return {
    ...set,
    secretKey: "",
    webhookSecret: "",
    hasSecretKey: Boolean(set.secretKey.trim()),
    hasWebhookSecret: Boolean(set.webhookSecret.trim()),
  };
}

/** Redact live secrets for support / non-editors. */
export function toStripeAdminView(
  cfg: PlatformStripeConfig,
  canEdit: boolean
): StripeAdminView {
  return {
    demoMode: cfg.demoMode !== false,
    activeEnv: activeStripeEnv(cfg),
    sandbox: toEnvView(cfg.sandbox, canEdit),
    live: toEnvView(cfg.live, canEdit),
  };
}

const CATALOG_KEYS = [
  "publishableKey",
  "priceIdWeekly",
  "priceIdMonthly",
  "priceIdYearly",
] as const;

const DISPLAY_KEYS = [
  "displayPriceWeekly",
  "displayPriceMonthly",
  "displayPriceYearly",
] as const;

function mergeCredentialPatch(
  current: StripeCredentialSet,
  patch: Partial<StripeCredentialSet> | undefined
): StripeCredentialSet {
  if (!patch || typeof patch !== "object") return current;
  const next: StripeCredentialSet = { ...current };

  // Empty secrets mean leave unchanged.
  if (typeof patch.secretKey === "string" && patch.secretKey.trim()) {
    next.secretKey = patch.secretKey.trim();
  }
  if (typeof patch.webhookSecret === "string" && patch.webhookSecret.trim()) {
    next.webhookSecret = patch.webhookSecret.trim();
  }

  // Catalog fields: explicit string (including "") replaces.
  for (const key of CATALOG_KEYS) {
    if (typeof patch[key] === "string") {
      next[key] = patch[key].trim();
    }
  }

  // Display prices: blank falls back to defaults (never empty in UI).
  for (const key of DISPLAY_KEYS) {
    if (typeof patch[key] === "string") {
      const trimmed = patch[key].trim();
      next[key] = trimmed || DEFAULT_STRIPE_CREDENTIALS[key];
    }
  }

  return next;
}

/**
 * Admin form / PUT body for Stripe settings.
 * Env sets are partial so secrets can be omitted (leave unchanged).
 * Do not use `Partial<PlatformStripeConfig>` — that still requires full
 * `StripeCredentialSet` when `sandbox` / `live` are present.
 */
export type StripeConfigPatch = {
  demoMode?: boolean;
  sandbox?: Partial<StripeCredentialSet>;
  live?: Partial<StripeCredentialSet>;
};

/**
 * Merge admin form patch into stored Stripe config.
 * Empty secret fields mean "leave unchanged".
 * Empty price IDs clear the stored value.
 */
export function mergeStripeConfigPatch(
  current: PlatformStripeConfig,
  patch: StripeConfigPatch
): PlatformStripeConfig {
  return {
    demoMode:
      typeof patch.demoMode === "boolean" ? patch.demoMode : current.demoMode,
    sandbox: mergeCredentialPatch(current.sandbox, patch.sandbox),
    live: mergeCredentialPatch(current.live, patch.live),
  };
}

export { DEFAULT_PLATFORM_STRIPE, DEFAULT_STRIPE_CREDENTIALS };

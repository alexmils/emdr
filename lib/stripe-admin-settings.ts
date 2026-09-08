import type { PlatformStripeConfig } from "@/lib/platform-settings";
import { DEFAULT_PLATFORM_STRIPE } from "@/lib/platform-settings";

const SECRET_FIELDS = ["secretKey", "webhookSecret"] as const;

/** Admin GET payload — secrets only for platform_admin. */
export type StripeAdminView = PlatformStripeConfig & {
  hasSecretKey: boolean;
  hasWebhookSecret: boolean;
};

export function stripeAdminStatus(cfg: PlatformStripeConfig): {
  catalogReady: boolean;
  webhookReady: boolean;
  stripeConfigured: boolean;
} {
  const catalogReady = Boolean(
    cfg.secretKey.trim() &&
      (cfg.priceIdWeekly.trim() ||
        cfg.priceIdMonthly.trim() ||
        cfg.priceIdYearly.trim())
  );
  const webhookReady = Boolean(cfg.webhookSecret.trim());
  return {
    catalogReady,
    webhookReady,
    stripeConfigured: catalogReady && webhookReady,
  };
}

/** Redact live secrets for support / non-editors. */
export function toStripeAdminView(
  cfg: PlatformStripeConfig,
  canEdit: boolean
): StripeAdminView {
  const hasSecretKey = Boolean(cfg.secretKey.trim());
  const hasWebhookSecret = Boolean(cfg.webhookSecret.trim());
  if (canEdit) {
    return { ...cfg, hasSecretKey, hasWebhookSecret };
  }
  return {
    ...cfg,
    secretKey: "",
    webhookSecret: "",
    hasSecretKey,
    hasWebhookSecret,
  };
}

/**
 * Merge admin form patch into stored Stripe config.
 * Empty secretKey / webhookSecret means "leave unchanged".
 */
export function mergeStripeConfigPatch(
  current: PlatformStripeConfig,
  patch: Partial<PlatformStripeConfig>
): PlatformStripeConfig {
  const next: PlatformStripeConfig = {
    ...current,
    ...patch,
    secretKey: current.secretKey,
    webhookSecret: current.webhookSecret,
  };

  for (const field of SECRET_FIELDS) {
    const incoming = patch[field];
    if (typeof incoming === "string" && incoming.trim()) {
      next[field] = incoming.trim();
    }
  }

  // Non-secret fields: allow explicit clear via empty string.
  if (typeof patch.publishableKey === "string") {
    next.publishableKey = patch.publishableKey.trim();
  }
  if (typeof patch.priceIdWeekly === "string") {
    next.priceIdWeekly = patch.priceIdWeekly.trim();
  }
  if (typeof patch.priceIdMonthly === "string") {
    next.priceIdMonthly = patch.priceIdMonthly.trim();
  }
  if (typeof patch.priceIdYearly === "string") {
    next.priceIdYearly = patch.priceIdYearly.trim();
  }
  if (typeof patch.displayPriceWeekly === "string") {
    next.displayPriceWeekly =
      patch.displayPriceWeekly.trim() ||
      DEFAULT_PLATFORM_STRIPE.displayPriceWeekly;
  }
  if (typeof patch.displayPriceMonthly === "string") {
    next.displayPriceMonthly =
      patch.displayPriceMonthly.trim() ||
      DEFAULT_PLATFORM_STRIPE.displayPriceMonthly;
  }
  if (typeof patch.displayPriceYearly === "string") {
    next.displayPriceYearly =
      patch.displayPriceYearly.trim() ||
      DEFAULT_PLATFORM_STRIPE.displayPriceYearly;
  }

  return next;
}

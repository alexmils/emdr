import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  mergeStripeConfigPatch,
  stripeAdminStatus,
  toStripeAdminView,
} from "../lib/stripe-admin-settings.ts";
import {
  DEFAULT_PLATFORM_STRIPE,
  DEFAULT_STRIPE_CREDENTIALS,
  normalizeStripeConfig,
} from "../lib/stripe-config.ts";
import { orderedBillingPlans, BILLING_PLANS } from "../lib/billing-constants.ts";

describe("normalizeStripeConfig", () => {
  it("migrates legacy flat keys into sandbox + demoMode", () => {
    const cfg = normalizeStripeConfig({
      secretKey: "sk_test_legacy",
      webhookSecret: "whsec_legacy",
      priceIdMonthly: "price_m",
      displayPriceMonthly: "$14.99",
    });
    assert.equal(cfg.demoMode, true);
    assert.equal(cfg.sandbox.secretKey, "sk_test_legacy");
    assert.equal(cfg.sandbox.priceIdMonthly, "price_m");
    assert.equal(cfg.live.secretKey, "");
  });

  it("keeps nested sandbox/live and demoMode false", () => {
    const cfg = normalizeStripeConfig({
      demoMode: false,
      sandbox: { ...DEFAULT_STRIPE_CREDENTIALS, secretKey: "sk_test" },
      live: { ...DEFAULT_STRIPE_CREDENTIALS, secretKey: "sk_live" },
    });
    assert.equal(cfg.demoMode, false);
    assert.equal(cfg.live.secretKey, "sk_live");
  });

  it("rewrites leftover euro display prices to dollars", () => {
    const cfg = normalizeStripeConfig({
      sandbox: {
        ...DEFAULT_STRIPE_CREDENTIALS,
        displayPriceWeekly: "€4.99",
        displayPriceMonthly: "€14.99",
        displayPriceYearly: "€99",
      },
    });
    assert.equal(cfg.sandbox.displayPriceWeekly, "$4.99");
    assert.equal(cfg.sandbox.displayPriceMonthly, "$14.99");
    assert.equal(cfg.sandbox.displayPriceYearly, "$99");
  });
});

describe("toStripeAdminView", () => {
  it("redacts secrets for non-editors", () => {
    const cfg = {
      ...DEFAULT_PLATFORM_STRIPE,
      sandbox: {
        ...DEFAULT_STRIPE_CREDENTIALS,
        secretKey: "sk_test_secret",
        webhookSecret: "whsec_secret",
        priceIdMonthly: "price_m",
      },
    };
    const view = toStripeAdminView(cfg, false);
    assert.equal(view.sandbox.secretKey, "");
    assert.equal(view.sandbox.webhookSecret, "");
    assert.equal(view.sandbox.hasSecretKey, true);
    assert.equal(view.sandbox.hasWebhookSecret, true);
    assert.equal(view.sandbox.priceIdMonthly, "price_m");
    assert.equal(view.demoMode, true);
  });

  it("never returns secrets — even for editors", () => {
    const cfg = {
      ...DEFAULT_PLATFORM_STRIPE,
      sandbox: {
        ...DEFAULT_STRIPE_CREDENTIALS,
        secretKey: "sk_test_secret",
        webhookSecret: "whsec_secret",
      },
    };
    const view = toStripeAdminView(cfg, true);
    assert.equal(view.sandbox.secretKey, "");
    assert.equal(view.sandbox.webhookSecret, "");
    assert.equal(view.sandbox.hasSecretKey, true);
    assert.equal(view.sandbox.hasWebhookSecret, true);
  });
});

describe("mergeStripeConfigPatch", () => {
  it("keeps secrets when patch sends empty strings", () => {
    const current = {
      ...DEFAULT_PLATFORM_STRIPE,
      sandbox: {
        ...DEFAULT_STRIPE_CREDENTIALS,
        secretKey: "sk_keep",
        webhookSecret: "whsec_keep",
        priceIdMonthly: "price_old",
      },
    };
    const next = mergeStripeConfigPatch(current, {
      sandbox: {
        secretKey: "",
        webhookSecret: "   ",
        priceIdMonthly: "price_new",
      },
    });
    assert.equal(next.sandbox.secretKey, "sk_keep");
    assert.equal(next.sandbox.webhookSecret, "whsec_keep");
    assert.equal(next.sandbox.priceIdMonthly, "price_new");
  });

  it("replaces secrets when non-empty and toggles demoMode", () => {
    const current = {
      ...DEFAULT_PLATFORM_STRIPE,
      sandbox: {
        ...DEFAULT_STRIPE_CREDENTIALS,
        secretKey: "sk_old",
        webhookSecret: "whsec_old",
      },
    };
    const next = mergeStripeConfigPatch(current, {
      demoMode: false,
      sandbox: {
        secretKey: " sk_new ",
        webhookSecret: "whsec_new",
      },
    });
    assert.equal(next.demoMode, false);
    assert.equal(next.sandbox.secretKey, "sk_new");
    assert.equal(next.sandbox.webhookSecret, "whsec_new");
  });
  it("clears price IDs when patch sends empty strings", () => {
    const current = {
      ...DEFAULT_PLATFORM_STRIPE,
      sandbox: {
        ...DEFAULT_STRIPE_CREDENTIALS,
        secretKey: "sk_keep",
        priceIdMonthly: "price_old",
        priceIdWeekly: "price_w",
      },
    };
    const next = mergeStripeConfigPatch(current, {
      sandbox: {
        priceIdMonthly: "",
        priceIdWeekly: "   ",
      },
    });
    assert.equal(next.sandbox.secretKey, "sk_keep");
    assert.equal(next.sandbox.priceIdMonthly, "");
    assert.equal(next.sandbox.priceIdWeekly, "");
  });
});

describe("stripeAdminStatus", () => {
  it("splits catalog vs webhook readiness on active env", () => {
    const catalogOnly = stripeAdminStatus({
      demoMode: true,
      sandbox: {
        ...DEFAULT_STRIPE_CREDENTIALS,
        secretKey: "sk",
        priceIdWeekly: "price_w",
      },
      live: { ...DEFAULT_STRIPE_CREDENTIALS },
    });
    assert.equal(catalogOnly.catalogReady, true);
    assert.equal(catalogOnly.webhookReady, false);
    assert.equal(catalogOnly.stripeConfigured, false);
    assert.equal(catalogOnly.demoMode, true);
    assert.equal(catalogOnly.activeEnv, "sandbox");

    const liveReady = stripeAdminStatus({
      demoMode: false,
      sandbox: { ...DEFAULT_STRIPE_CREDENTIALS },
      live: {
        ...DEFAULT_STRIPE_CREDENTIALS,
        secretKey: "sk_live",
        webhookSecret: "whsec",
        priceIdMonthly: "price_m",
      },
    });
    assert.equal(liveReady.stripeConfigured, true);
    assert.equal(liveReady.activeEnv, "live");
  });
});

describe("orderedBillingPlans", () => {
  it("returns yearly then monthly then weekly", () => {
    const ids = orderedBillingPlans(BILLING_PLANS).map((p) => p.id);
    assert.deepEqual(ids, ["yearly", "monthly", "weekly"]);
  });
});

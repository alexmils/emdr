import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  mergeStripeConfigPatch,
  stripeAdminStatus,
  toStripeAdminView,
} from "../lib/stripe-admin-settings.ts";
import { DEFAULT_PLATFORM_STRIPE } from "../lib/platform-settings.ts";
import { orderedBillingPlans, BILLING_PLANS } from "../lib/billing-constants.ts";

describe("toStripeAdminView", () => {
  it("redacts secrets for non-editors", () => {
    const cfg = {
      ...DEFAULT_PLATFORM_STRIPE,
      secretKey: "sk_test_secret",
      webhookSecret: "whsec_secret",
      priceIdMonthly: "price_m",
    };
    const view = toStripeAdminView(cfg, false);
    assert.equal(view.secretKey, "");
    assert.equal(view.webhookSecret, "");
    assert.equal(view.hasSecretKey, true);
    assert.equal(view.hasWebhookSecret, true);
    assert.equal(view.priceIdMonthly, "price_m");
  });

  it("returns secrets for editors", () => {
    const cfg = {
      ...DEFAULT_PLATFORM_STRIPE,
      secretKey: "sk_test_secret",
      webhookSecret: "whsec_secret",
    };
    const view = toStripeAdminView(cfg, true);
    assert.equal(view.secretKey, "sk_test_secret");
    assert.equal(view.webhookSecret, "whsec_secret");
  });
});

describe("mergeStripeConfigPatch", () => {
  it("keeps secrets when patch sends empty strings", () => {
    const current = {
      ...DEFAULT_PLATFORM_STRIPE,
      secretKey: "sk_keep",
      webhookSecret: "whsec_keep",
      priceIdMonthly: "price_old",
    };
    const next = mergeStripeConfigPatch(current, {
      secretKey: "",
      webhookSecret: "   ",
      priceIdMonthly: "price_new",
    });
    assert.equal(next.secretKey, "sk_keep");
    assert.equal(next.webhookSecret, "whsec_keep");
    assert.equal(next.priceIdMonthly, "price_new");
  });

  it("replaces secrets when non-empty", () => {
    const current = {
      ...DEFAULT_PLATFORM_STRIPE,
      secretKey: "sk_old",
      webhookSecret: "whsec_old",
    };
    const next = mergeStripeConfigPatch(current, {
      secretKey: " sk_new ",
      webhookSecret: "whsec_new",
    });
    assert.equal(next.secretKey, "sk_new");
    assert.equal(next.webhookSecret, "whsec_new");
  });
});

describe("stripeAdminStatus", () => {
  it("splits catalog vs webhook readiness", () => {
    const catalogOnly = stripeAdminStatus({
      ...DEFAULT_PLATFORM_STRIPE,
      secretKey: "sk",
      priceIdWeekly: "price_w",
    });
    assert.equal(catalogOnly.catalogReady, true);
    assert.equal(catalogOnly.webhookReady, false);
    assert.equal(catalogOnly.stripeConfigured, false);

    const live = stripeAdminStatus({
      ...DEFAULT_PLATFORM_STRIPE,
      secretKey: "sk",
      webhookSecret: "whsec",
      priceIdMonthly: "price_m",
    });
    assert.equal(live.stripeConfigured, true);
  });
});

describe("orderedBillingPlans", () => {
  it("returns yearly then monthly then weekly", () => {
    const ids = orderedBillingPlans(BILLING_PLANS).map((p) => p.id);
    assert.deepEqual(ids, ["yearly", "monthly", "weekly"]);
  });
});

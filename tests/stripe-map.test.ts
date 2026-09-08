import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { planIdFromStripePriceId } from "../lib/billing-constants.ts";
import { mapStripeSubscription } from "../lib/stripe-admin.ts";

describe("mapStripeSubscription", () => {
  it("maps trialing subscription fields", () => {
    const mapped = mapStripeSubscription({
      id: "sub_1",
      status: "trialing",
      customer: "cus_1",
      items: {
        data: [
          {
            price: {
              id: "price_month",
              unit_amount: 1499,
              currency: "eur",
            },
          },
        ],
      },
      current_period_end: 1_800_000_000,
      trial_end: 1_700_000_000,
      metadata: { user_id: "u1", plan: "monthly" },
    });

    assert.equal(mapped.status, "trialing");
    assert.equal(mapped.amountCents, 1499);
    assert.equal(mapped.currency, "EUR");
    assert.equal(mapped.stripeCustomerId, "cus_1");
    assert.equal(mapped.stripeSubscriptionId, "sub_1");
    assert.ok(mapped.trialEndsAt);
    assert.ok(mapped.renewsAt);
  });

  it("maps canceled / unpaid as free plan label", () => {
    const mapped = mapStripeSubscription({
      id: "sub_2",
      status: "canceled",
      customer: "cus_2",
      items: { data: [{ price: { id: "price_x", unit_amount: 0, currency: "eur" } }] },
    });
    assert.equal(mapped.plan, "free");
    assert.equal(mapped.status, "canceled");
  });
});

describe("planIdFromStripePriceId", () => {
  it("falls back to pro when env prices are unset", () => {
    assert.equal(planIdFromStripePriceId("price_unknown"), "pro");
  });
});

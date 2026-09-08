import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  hasBlockingStripeSubscription,
  shouldIncludeCheckoutTrial,
} from "../lib/checkout-rules.ts";

describe("hasBlockingStripeSubscription", () => {
  it("blocks active and past_due with a subscription id", () => {
    assert.equal(
      hasBlockingStripeSubscription({
        stripeSubscriptionId: "sub_1",
        status: "active",
      }),
      true
    );
    assert.equal(
      hasBlockingStripeSubscription({
        stripeSubscriptionId: "sub_1",
        status: "past_due",
      }),
      true
    );
    assert.equal(
      hasBlockingStripeSubscription({
        stripeSubscriptionId: "sub_1",
        status: "unpaid",
      }),
      true
    );
  });

  it("allows checkout when there is no subscription id", () => {
    assert.equal(
      hasBlockingStripeSubscription({
        stripeSubscriptionId: null,
        status: "none",
      }),
      false
    );
  });
});

describe("shouldIncludeCheckoutTrial", () => {
  it("includes trial for fresh accounts", () => {
    assert.equal(
      shouldIncludeCheckoutTrial({
        isTrialLimited: false,
        accessTier: "none",
        guidedUsed: 0,
        status: "none",
        stripeSubscriptionId: null,
      }),
      true
    );
  });

  it("excludes trial when a Stripe subscription already exists", () => {
    assert.equal(
      shouldIncludeCheckoutTrial({
        isTrialLimited: false,
        accessTier: "blocked",
        guidedUsed: 0,
        status: "canceled",
        stripeSubscriptionId: "sub_old",
      }),
      false
    );
  });

  it("excludes trial for past_due / unpaid", () => {
    assert.equal(
      shouldIncludeCheckoutTrial({
        isTrialLimited: false,
        accessTier: "blocked",
        guidedUsed: 0,
        status: "past_due",
        stripeSubscriptionId: null,
      }),
      false
    );
  });
});

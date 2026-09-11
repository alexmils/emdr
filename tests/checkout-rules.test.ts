import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  hasBlockingStripeSubscription,
  shouldApplyCheckoutSessionSync,
  shouldIncludeCheckoutTrial,
  shouldOfferBillingPortal,
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

  it("allows checkout after cancel", () => {
    assert.equal(
      hasBlockingStripeSubscription({
        stripeSubscriptionId: "sub_old",
        status: "canceled",
      }),
      false
    );
  });
});

describe("shouldOfferBillingPortal", () => {
  it("offers portal for recovery statuses including expired trialing", () => {
    assert.equal(shouldOfferBillingPortal({ status: "trialing" }), true);
    assert.equal(shouldOfferBillingPortal({ status: "past_due" }), true);
    assert.equal(shouldOfferBillingPortal({ status: "unpaid" }), true);
    assert.equal(shouldOfferBillingPortal({ status: "incomplete" }), true);
    assert.equal(shouldOfferBillingPortal({ status: "active" }), true);
    assert.equal(shouldOfferBillingPortal({ status: "canceled" }), false);
  });
});

describe("shouldApplyCheckoutSessionSync", () => {
  it("applies when there is no existing subscription", () => {
    assert.equal(
      shouldApplyCheckoutSessionSync({
        existingSubscriptionId: null,
        existingStatus: "none",
        incomingSubscriptionId: "sub_new",
      }),
      true
    );
  });

  it("applies when the session matches the current subscription", () => {
    assert.equal(
      shouldApplyCheckoutSessionSync({
        existingSubscriptionId: "sub_1",
        existingStatus: "trialing",
        incomingSubscriptionId: "sub_1",
      }),
      true
    );
  });

  it("refuses an old session when a newer live subscription exists", () => {
    assert.equal(
      shouldApplyCheckoutSessionSync({
        existingSubscriptionId: "sub_new",
        existingStatus: "active",
        incomingSubscriptionId: "sub_old",
      }),
      false
    );
  });

  it("allows a new session after cancel", () => {
    assert.equal(
      shouldApplyCheckoutSessionSync({
        existingSubscriptionId: "sub_old",
        existingStatus: "canceled",
        incomingSubscriptionId: "sub_new",
      }),
      true
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

  it("excludes trial for canceled without relying only on guided use", () => {
    assert.equal(
      shouldIncludeCheckoutTrial({
        isTrialLimited: false,
        accessTier: "blocked",
        guidedUsed: 0,
        status: "canceled",
        stripeSubscriptionId: null,
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

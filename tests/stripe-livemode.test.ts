import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { inferLivemodeFromStripeId } from "../lib/stripe.ts";

describe("inferLivemodeFromStripeId", () => {
  it("detects test and live checkout session prefixes", () => {
    assert.equal(inferLivemodeFromStripeId("cs_test_abc"), false);
    assert.equal(inferLivemodeFromStripeId("cs_live_abc"), true);
  });

  it("detects secret key prefixes", () => {
    assert.equal(inferLivemodeFromStripeId("sk_test_xxx"), false);
    assert.equal(inferLivemodeFromStripeId("sk_live_xxx"), true);
  });

  it("returns null for opaque customer/subscription ids", () => {
    assert.equal(inferLivemodeFromStripeId("cus_abc"), null);
    assert.equal(inferLivemodeFromStripeId("sub_abc"), null);
    assert.equal(inferLivemodeFromStripeId("price_abc"), null);
  });
});

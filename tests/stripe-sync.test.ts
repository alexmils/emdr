import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type Stripe from "stripe";
import {
  applyCatalogSyncToStripeConfig,
  formatStripeDisplayPrice,
  pickPlanPricesFromStripeList,
} from "../lib/stripe-sync.ts";
import { DEFAULT_PLATFORM_STRIPE } from "../lib/platform-settings.ts";

describe("formatStripeDisplayPrice", () => {
  it("formats eur and usd", () => {
    assert.equal(formatStripeDisplayPrice(499, "eur"), "€4.99");
    assert.equal(formatStripeDisplayPrice(1499, "eur"), "€14.99");
    assert.equal(formatStripeDisplayPrice(9900, "eur"), "€99");
    assert.equal(formatStripeDisplayPrice(999, "usd"), "$9.99");
  });
});

describe("pickPlanPricesFromStripeList", () => {
  it("picks one active price per interval and prefers nura nicknames", () => {
    const prices = [
      {
        id: "price_old_month",
        active: true,
        type: "recurring",
        nickname: "Old Monthly",
        unit_amount: 999,
        currency: "eur",
        created: 1_700_000_000,
        recurring: { interval: "month", interval_count: 1 },
        product: "prod_x",
      },
      {
        id: "price_nura_month",
        active: true,
        type: "recurring",
        nickname: "NuraHelp Monthly",
        unit_amount: 1499,
        currency: "eur",
        created: 1_700_000_100,
        recurring: { interval: "month", interval_count: 1 },
        product: {
          id: "prod_nura",
          name: "NuraHelp AI",
          object: "product",
          metadata: { app: "nurahelp" },
        },
      },
      {
        id: "price_week",
        active: true,
        type: "recurring",
        nickname: "NuraHelp Weekly",
        unit_amount: 499,
        currency: "eur",
        created: 1_700_000_200,
        recurring: { interval: "week", interval_count: 1 },
        product: {
          id: "prod_nura",
          name: "NuraHelp AI",
          object: "product",
          metadata: { app: "nurahelp" },
        },
      },
      {
        id: "price_year",
        active: true,
        type: "recurring",
        nickname: "Yearly",
        unit_amount: 9900,
        currency: "eur",
        created: 1_700_000_300,
        recurring: { interval: "year", interval_count: 1 },
        product: {
          id: "prod_nura",
          name: "NuraHelp AI",
          object: "product",
          metadata: { app: "nurahelp" },
        },
      },
      {
        id: "price_inactive",
        active: false,
        type: "recurring",
        nickname: "Dead",
        unit_amount: 100,
        currency: "eur",
        created: 1_800_000_000,
        recurring: { interval: "week", interval_count: 1 },
        product: "prod_x",
      },
    ] as unknown as Stripe.Price[];

    const sync = pickPlanPricesFromStripeList(prices);
    assert.equal(sync.weekly?.priceId, "price_week");
    assert.equal(sync.weekly?.displayPrice, "€4.99");
    assert.equal(sync.monthly?.priceId, "price_nura_month");
    assert.equal(sync.monthly?.displayPrice, "€14.99");
    assert.equal(sync.yearly?.priceId, "price_year");
    assert.equal(sync.yearly?.displayPrice, "€99");
  });

  it("prefers newer price when names tie", () => {
    const prices = [
      {
        id: "price_old",
        active: true,
        type: "recurring",
        nickname: "Monthly",
        unit_amount: 1000,
        currency: "eur",
        created: 1_000,
        recurring: { interval: "month", interval_count: 1 },
        product: "prod_a",
      },
      {
        id: "price_new",
        active: true,
        type: "recurring",
        nickname: "Monthly",
        unit_amount: 2000,
        currency: "eur",
        created: 2_000,
        recurring: { interval: "month", interval_count: 1 },
        product: "prod_b",
      },
    ] as unknown as Stripe.Price[];
    const sync = pickPlanPricesFromStripeList(prices);
    assert.equal(sync.monthly?.priceId, "price_new");
  });
});

describe("applyCatalogSyncToStripeConfig", () => {
  it("writes synced ids and keeps missing intervals", () => {
    const next = applyCatalogSyncToStripeConfig(DEFAULT_PLATFORM_STRIPE, {
      weekly: {
        priceId: "price_w",
        displayPrice: "€4.99",
        unitAmount: 499,
        currency: "EUR",
        nickname: null,
        productId: null,
      },
      monthly: null,
      yearly: {
        priceId: "price_y",
        displayPrice: "€99",
        unitAmount: 9900,
        currency: "EUR",
        nickname: null,
        productId: null,
      },
      scanned: 3,
    });
    assert.equal(next.priceIdWeekly, "price_w");
    assert.equal(next.displayPriceWeekly, "€4.99");
    assert.equal(next.priceIdMonthly, "");
    assert.equal(next.displayPriceMonthly, "€14.99");
    assert.equal(next.priceIdYearly, "price_y");
  });
});

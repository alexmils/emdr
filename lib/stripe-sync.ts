import type Stripe from "stripe";
import type { StripeCredentialSet } from "@/lib/stripe-config";

export type StripePriceInterval = "week" | "month" | "year";

export type SyncedPlanPrice = {
  priceId: string;
  displayPrice: string;
  unitAmount: number;
  currency: string;
  nickname: string | null;
  productId: string | null;
};

export type StripeCatalogSyncResult = {
  weekly: SyncedPlanPrice | null;
  monthly: SyncedPlanPrice | null;
  yearly: SyncedPlanPrice | null;
  scanned: number;
};

/** Format Stripe unit_amount for admin/UI display (e.g. 499 + eur → €4.99). */
export function formatStripeDisplayPrice(
  unitAmount: number | null | undefined,
  currency: string | null | undefined
): string {
  if (unitAmount == null || !Number.isFinite(unitAmount)) return "";
  const cur = (currency || "eur").toLowerCase();
  const major = unitAmount / 100;
  const formatted =
    Number.isInteger(major) || Math.abs(major * 100 - Math.round(major * 100)) < 1e-6
      ? major % 1 === 0
        ? String(major)
        : major.toFixed(2)
      : major.toFixed(2);
  const symbols: Record<string, string> = {
    eur: "€",
    usd: "$",
    gbp: "£",
  };
  const symbol = symbols[cur];
  if (symbol) return `${symbol}${formatted}`;
  return `${formatted} ${cur.toUpperCase()}`;
}

function productMeta(price: Stripe.Price): Record<string, string> {
  if (
    typeof price.product === "object" &&
    price.product &&
    !("deleted" in price.product && price.product.deleted)
  ) {
    const meta = (price.product as Stripe.Product).metadata;
    return meta && typeof meta === "object" ? meta : {};
  }
  return {};
}

function productName(price: Stripe.Price): string {
  if (
    typeof price.product === "object" &&
    price.product &&
    !("deleted" in price.product && price.product.deleted)
  ) {
    return String((price.product as Stripe.Product).name || "").toLowerCase();
  }
  return "";
}

/** Higher is better. Prefer app=nurahelp metadata, then Nura names, then newest. */
export function scorePrice(
  price: Stripe.Price,
  interval: StripePriceInterval
): number {
  let score = 0;
  const nick = (price.nickname || "").toLowerCase();
  const name = productName(price);
  const meta = productMeta(price);
  if (meta.app === "nurahelp" || meta.app === "nura") score += 100;
  if (nick.includes("nura") || name.includes("nura")) score += 50;
  const intervalWords =
    interval === "week"
      ? ["week", "weekly"]
      : interval === "month"
        ? ["month", "monthly"]
        : ["year", "yearly", "annual"];
  if (intervalWords.some((w) => nick.includes(w))) score += 20;
  // Prefer newest: unix created is ~1.7e9 — use as tie-breaker directly.
  if (typeof price.created === "number") score += price.created / 1e12;
  return score;
}

function toSynced(price: Stripe.Price): SyncedPlanPrice {
  const productId =
    typeof price.product === "string"
      ? price.product
      : price.product && !("deleted" in price.product && price.product.deleted)
        ? price.product.id
        : null;
  return {
    priceId: price.id,
    displayPrice: formatStripeDisplayPrice(price.unit_amount, price.currency),
    unitAmount: price.unit_amount ?? 0,
    currency: (price.currency || "eur").toUpperCase(),
    nickname: price.nickname ?? null,
    productId,
  };
}

/**
 * Pick one active recurring price per week/month/year from a Stripe price list.
 * Prefers metadata app=nurahelp, then NuraHelp names, then newest.
 */
export function pickPlanPricesFromStripeList(
  prices: Stripe.Price[]
): StripeCatalogSyncResult {
  const byInterval: Record<StripePriceInterval, Stripe.Price[]> = {
    week: [],
    month: [],
    year: [],
  };

  for (const price of prices) {
    if (!price.active || price.type !== "recurring") continue;
    const interval = price.recurring?.interval;
    if (interval !== "week" && interval !== "month" && interval !== "year") {
      continue;
    }
    if (price.recurring?.interval_count && price.recurring.interval_count !== 1) {
      continue;
    }
    byInterval[interval].push(price);
  }

  const pick = (interval: StripePriceInterval): SyncedPlanPrice | null => {
    const list = byInterval[interval];
    if (list.length === 0) return null;
    list.sort((a, b) => {
      const diff = scorePrice(b, interval) - scorePrice(a, interval);
      if (diff !== 0) return diff;
      return (b.created ?? 0) - (a.created ?? 0);
    });
    return toSynced(list[0]!);
  };

  return {
    weekly: pick("week"),
    monthly: pick("month"),
    yearly: pick("year"),
    scanned: prices.length,
  };
}

export function applyCatalogSyncToCredentials(
  current: import("@/lib/stripe-config").StripeCredentialSet,
  sync: StripeCatalogSyncResult
): import("@/lib/stripe-config").StripeCredentialSet {
  return {
    ...current,
    priceIdWeekly: sync.weekly?.priceId ?? current.priceIdWeekly,
    priceIdMonthly: sync.monthly?.priceId ?? current.priceIdMonthly,
    priceIdYearly: sync.yearly?.priceId ?? current.priceIdYearly,
    displayPriceWeekly:
      sync.weekly?.displayPrice || current.displayPriceWeekly,
    displayPriceMonthly:
      sync.monthly?.displayPrice || current.displayPriceMonthly,
    displayPriceYearly:
      sync.yearly?.displayPrice || current.displayPriceYearly,
  };
}

/** @deprecated use applyCatalogSyncToCredentials */
export function applyCatalogSyncToStripeConfig(
  current: import("@/lib/stripe-config").StripeCredentialSet,
  sync: StripeCatalogSyncResult
) {
  return applyCatalogSyncToCredentials(current, sync);
}

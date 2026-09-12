import { readConsent } from "@/lib/marketing-consent";

export type MetaStandardEvent =
  | "CompleteRegistration"
  | "InitiateCheckout"
  | "StartTrial"
  | "Purchase"
  | "Subscribe"
  | "Lead";

export type MetaEventParams = {
  value?: number;
  currency?: string;
  content_name?: string;
  content_category?: string;
  status?: boolean;
};

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function onceKeyStorage(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const storageKey = `nura_meta_once_${key}`;
    if (window.sessionStorage.getItem(storageKey)) return false;
    window.sessionStorage.setItem(storageKey, "1");
    return true;
  } catch {
    return true;
  }
}

/**
 * Fire a Meta Pixel standard event when fbq is present (GTM Custom HTML).
 * Also pushes dataLayer for Tag Manager custom triggers.
 * Skips fbq when marketing cookies were explicitly rejected.
 */
export function trackMetaEvent(
  event: MetaStandardEvent,
  params?: MetaEventParams,
  opts?: { onceKey?: string }
): void {
  if (typeof window === "undefined") return;
  if (opts?.onceKey && !onceKeyStorage(opts.onceKey)) return;

  const consent = readConsent();
  const marketingDenied = consent?.marketing === false;
  const payload = params ?? {};

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: `meta_${event}`,
    meta_event: event,
    ...payload,
  });

  if (marketingDenied) return;
  if (typeof window.fbq !== "function") return;
  window.fbq("track", event, payload);
}

/** Plan display → Meta purchase/trial value helpers. */
export function metaMoneyFromPlanPrice(
  displayPrice: string | undefined
): { value?: number; currency: string } {
  if (!displayPrice) return { currency: "USD" };
  const currency = /€|eur/i.test(displayPrice)
    ? "EUR"
    : /£|gbp/i.test(displayPrice)
      ? "GBP"
      : "USD";
  const num = Number(displayPrice.replace(/[^0-9.,]/g, "").replace(",", "."));
  if (!Number.isFinite(num) || num <= 0) return { currency };
  return { value: num, currency };
}

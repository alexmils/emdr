import { EMDR_FAQ_ITEMS } from "@/lib/emdr-faq";
import { LANDING_FAQ_ITEMS } from "@/lib/landing-faq";

export type PublicFaqItem = {
  q: string;
  a: string;
};

/**
 * Merged public FAQ for `/faq` — landing first, then EMDR items.
 * Deduped by exact question string.
 */
export const PUBLIC_FAQ_ITEMS: readonly PublicFaqItem[] = (() => {
  const seen = new Set<string>();
  const out: PublicFaqItem[] = [];
  for (const item of [...LANDING_FAQ_ITEMS, ...EMDR_FAQ_ITEMS]) {
    if (seen.has(item.q)) continue;
    seen.add(item.q);
    out.push({ q: item.q, a: item.a });
  }
  return out;
})();

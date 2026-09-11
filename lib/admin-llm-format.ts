/** Client-safe LLM usage formatters (no server imports). */

/** Estimated LLM cost from micros (1 USD = 1_000_000). */
export function formatUsdMicros(micros: number) {
  const usd = (Number(micros) || 0) / 1_000_000;
  const digits = usd > 0 && usd < 0.01 ? 4 : 2;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(usd);
}

export function formatTokenCount(n: number) {
  const value = Number(n) || 0;
  if (!Number.isFinite(value) || value <= 0) return "0";
  if (value < 1000) return String(Math.round(value));
  if (value < 1_000_000) {
    return `${(value / 1000).toFixed(value < 10_000 ? 1 : 0)}k`;
  }
  return `${(value / 1_000_000).toFixed(value < 10_000_000 ? 2 : 1)}M`;
}

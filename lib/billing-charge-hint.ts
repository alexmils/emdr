/** Days-until-charge copy for the /app workspace header. */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type ChargeHintInput = {
  status?: string | null;
  accessTier?: string | null;
  trialEndsAt?: string | null;
  renewsAt?: string | null;
  now?: Date;
};

export type ChargeHint = {
  days: number;
  /** ISO date used for the countdown */
  at: string;
  kind: "trial" | "renew";
  label: string;
};

/** Whole days remaining until `iso`, floored at 0. Uses ceil so partial days still show as 1+. */
export function daysUntilIso(iso: string, now: Date = new Date()): number | null {
  const end = new Date(iso);
  if (Number.isNaN(end.getTime())) return null;
  const diff = end.getTime() - now.getTime();
  if (diff <= 0) return 0;
  return Math.ceil(diff / MS_PER_DAY);
}

function formatChargeLabel(days: number, kind: "trial" | "renew"): string {
  if (kind === "trial") {
    if (days <= 0) return "Charges today";
    if (days === 1) return "Charges in 1 day";
    return `Charges in ${days} days`;
  }
  if (days <= 0) return "Renews today";
  if (days === 1) return "Renews in 1 day";
  return `Renews in ${days} days`;
}

/**
 * Prefer trial end → first charge; else active renew date.
 * Hide when legacy / unpaid / no usable date.
 */
export function resolveChargeHint(input: ChargeHintInput): ChargeHint | null {
  const now = input.now ?? new Date();
  const status = (input.status ?? "").toLowerCase();
  const tier = (input.accessTier ?? "").toLowerCase();

  if (tier === "legacy" || status === "legacy") return null;

  const trialIso = input.trialEndsAt?.trim() || null;
  if ((status === "trialing" || tier === "trialing") && trialIso) {
    const days = daysUntilIso(trialIso, now);
    if (days === null) return null;
    return {
      days,
      at: trialIso,
      kind: "trial",
      label: formatChargeLabel(days, "trial"),
    };
  }

  const renewIso = input.renewsAt?.trim() || null;
  if ((status === "active" || tier === "active") && renewIso) {
    const days = daysUntilIso(renewIso, now);
    if (days === null) return null;
    return {
      days,
      at: renewIso,
      kind: "renew",
      label: formatChargeLabel(days, "renew"),
    };
  }

  return null;
}

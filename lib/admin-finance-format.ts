/** Client-safe finance helpers (no server / db imports). */

export type FinancePlanKey = "weekly" | "monthly" | "yearly" | "other";

export type FinanceStripeHealth = {
  demoMode: boolean;
  catalogReady: boolean;
  webhookReady: boolean;
};

export type FinanceStripeBanner = {
  title: string;
  body: string;
  cta: string;
  tone: "ok" | "warn";
};

export type AdminFinancePoint = {
  date: string;
  label: string;
  collectedCents: number;
};

export type AdminFinanceSource = {
  key: FinancePlanKey;
  label: string;
  amountCents: number;
  count: number;
  pct: number;
};

export type AdminFinanceWallet = {
  id: string;
  label: string;
  detail: string;
  amountLabel: string;
  mark: string;
  badge?: string;
};

export type AdminFinanceRenewal = {
  userId: string;
  email: string;
  name: string | null;
  plan: string;
  status: string;
  amountCents: number;
  currency: string;
  renewsAt: string;
};

export type AdminFinancePayment = {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  status: string;
  amountCents: number;
  currency: string;
  description: string | null;
  livemode: boolean | null;
  occurredAt: string;
};

export type AdminFinanceLookup = {
  userId: string;
  email: string;
  name: string | null;
};

export type AdminFinanceDashboard = {
  generatedAt: string;
  currency: string;
  kpis: {
    mrrCents: number;
    collectedThisMonthCents: number;
    collectedLastMonthCents: number;
    aiSpendUsdMicros: number;
    aiSpendLastMonthUsdMicros: number;
    paidSharePct: number;
    activePaid: number;
    totalUsers: number;
  };
  incomeSources: AdminFinanceSource[];
  stripe: {
    demoMode: boolean;
    catalogReady: boolean;
    webhookReady: boolean;
    availableCents: number | null;
    pendingCents: number | null;
    stripeCurrency: string | null;
  };
  series7d: AdminFinancePoint[];
  seriesMonthly: AdminFinancePoint[];
  allocation: AdminFinanceSource[];
  wallets: AdminFinanceWallet[];
  upcoming: AdminFinanceRenewal[];
  upcomingTotalCents: number;
  dueThisMonth: number;
  autopayTodayCents: number;
  payments: AdminFinancePayment[];
  lookup: AdminFinanceLookup[];
};

const PLAN_LABELS: Record<FinancePlanKey, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
  other: "Other",
};

export function financePlanLabel(plan: string): string {
  if (plan === "weekly" || plan === "monthly" || plan === "yearly") {
    return PLAN_LABELS[plan];
  }
  if (plan === "pro") return "Pro";
  if (plan === "free" || plan === "none") return "Free";
  return plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : "Other";
}

export function financePlanKey(plan: string): FinancePlanKey {
  if (plan === "weekly" || plan === "monthly" || plan === "yearly") return plan;
  return "other";
}

/** Convert a list-price amount into monthly recurring cents. */
export function mrrCentsForPlan(plan: string, amountCents: number): number {
  const amount = Math.max(0, Math.round(Number(amountCents) || 0));
  if (amount <= 0) return 0;
  if (plan === "yearly") return Math.round(amount / 12);
  if (plan === "weekly") return Math.round((amount * 52) / 12);
  if (plan === "free" || plan === "none") return 0;
  return amount;
}

export function sharePct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}

export function formatMoneyCompact(cents: number, currency = "EUR"): string {
  const value = (Number(cents) || 0) / 100;
  const abs = Math.abs(value);
  const code = (currency || "EUR").toUpperCase();
  if (abs >= 10_000) {
    const n = (abs / 1000).toFixed(abs >= 100_000 ? 0 : 1);
    try {
      const parts = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: code,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).formatToParts(0);
      const symbol = parts.find((p) => p.type === "currency")?.value ?? `${code} `;
      return `${value < 0 ? "-" : ""}${symbol}${n}K`;
    } catch {
      return `${value < 0 ? "-" : ""}${code} ${n}K`;
    }
  }
  const fractionDigits = Math.abs(Math.round(cents)) % 100 === 0 ? 0 : 2;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: code,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatMoneyDelta(cents: number, currency = "EUR"): string {
  const formatted = formatMoneyCompact(Math.abs(cents), currency);
  if (cents > 0) return `${formatted} above last month`;
  if (cents < 0) return `${formatted} below last month`;
  return "Same as last month";
}

export function stripeBannerCopy(
  health: FinanceStripeHealth
): FinanceStripeBanner {
  if (!health.catalogReady) {
    return {
      title: "Stripe catalog is incomplete",
      body: "Add a secret key and at least one price before checkout can run.",
      cta: "Open Stripe",
      tone: "warn",
    };
  }
  if (!health.webhookReady) {
    return {
      title: "Webhook secret missing",
      body: "Checkout can start, but renewals will not sync until the webhook is set.",
      cta: "Open Stripe",
      tone: "warn",
    };
  }
  if (health.demoMode) {
    return {
      title: "Demo mode is on",
      body: "New checkouts use the sandbox. Nobody is charged for real.",
      cta: "Open Stripe",
      tone: "ok",
    };
  }
  return {
    title: "Live charges are on",
    body: "New checkouts use the live Stripe account.",
    cta: "Open Stripe",
    tone: "ok",
  };
}

export function financeCsvCell(value: string | number | null | undefined): string {
  const raw = value == null ? "" : String(value);
  if (/[",\n\r]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

export function financeCsv(rows: Array<Array<string | number | null | undefined>>): string {
  return rows.map((row) => row.map(financeCsvCell).join(",")).join("\n");
}

export function formatFinanceDate(iso = new Date().toISOString()): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatUpdatedAgo(iso: string, now = Date.now()): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "Updated just now";
  const mins = Math.max(0, Math.round((now - then) / 60000));
  if (mins < 1) return "Updated just now";
  if (mins === 1) return "Updated 1 min ago";
  if (mins < 60) return `Updated ${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours === 1) return "Updated 1 hour ago";
  return `Updated ${hours} hours ago`;
}

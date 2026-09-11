/** Client-safe analytics helpers (no server / db imports). */

export type AnalyticsRangeDays = 7 | 28 | 84;

export type AdminAnalyticsPoint = {
  label: string;
  value: number;
};

export type AdminAnalyticsHour = {
  label: string;
  user: number;
  assistant: number;
};

export type AdminAnalyticsMix = {
  key: string;
  label: string;
  value: number;
};

export type AdminAnalyticsSurface = {
  key: string;
  label: string;
  count: number;
  avgSeconds: number;
  bouncePct: number;
};

export type AdminAnalyticsDashboard = {
  generatedAt: string;
  days: AnalyticsRangeDays;
  kpis: {
    uniqueUsers: number;
    uniqueUsersPrev: number;
    sessions: number;
    sessionsPrev: number;
    messages: number;
    messagesPrev: number;
    engagementPct: number;
    engagementPctPrev: number;
    conversionPct: number;
    conversionPctPrev: number;
  };
  quality: AdminAnalyticsPoint[];
  qualityPrev: AdminAnalyticsPoint[];
  hourly: AdminAnalyticsHour[];
  liveCount: number;
  live: boolean;
  mix: AdminAnalyticsMix[];
  surfaces: AdminAnalyticsSurface[];
  sources: AdminAnalyticsMix[];
  audience: AdminAnalyticsMix[];
  conversions: AdminAnalyticsMix[];
};

export function parseAnalyticsDays(raw: unknown): AnalyticsRangeDays {
  const n = Number(raw);
  if (n === 7 || n === 84) return n;
  return 28;
}

export function firstNameFrom(name: string | null | undefined, email = ""): string {
  const n = name?.trim();
  if (n) return n.split(/\s+/)[0] ?? n;
  const local = email.split("@")[0]?.trim();
  return local || "there";
}

export function formatCountCompact(n: number): string {
  const value = Number(n) || 0;
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 1 : 1)}M`;
  }
  if (abs >= 1000) {
    const digits = abs >= 100_000 ? 1 : 1;
    return `${sign}${(abs / 1000).toFixed(digits)}k`;
  }
  return String(Math.round(value));
}

export function formatPct(n: number): string {
  const value = Number(n) || 0;
  const digits = Math.abs(value) >= 10 ? 1 : 1;
  return `${value.toFixed(digits)}%`;
}

export function formatAvgDuration(seconds: number): string {
  const s = Math.max(0, Math.round(Number(seconds) || 0));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m ${String(rem).padStart(2, "0")}s`;
}

export function rangeLabel(days: AnalyticsRangeDays): string {
  if (days === 7) return "Last 7 days";
  if (days === 84) return "Last 12 weeks";
  return "Last 4 weeks";
}

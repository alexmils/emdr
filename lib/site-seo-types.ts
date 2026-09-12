/**
 * SEO status / page DTO types — client-safe (no DB).
 */

import type { SeoPageId } from "@/lib/seo-config";

export type SiteSeoPage = {
  id: SeoPageId;
  path: string;
  label: string;
  title: string;
  description: string;
  ogTitle: string;
  ogImageUrl: string;
  canonical: string;
  indexable: boolean;
};

export type ConnectionStatus =
  | "connected"
  | "not_connected"
  | "via_tag_manager";

export type SeoConnection = {
  id: string;
  name: string;
  status: ConnectionStatus;
  publicIdMasked: string | null;
  detail: string | null;
  hint: string;
};

export type MarketingSeoStatus = {
  siteUrl: string;
  title: string;
  description: string;
  canonical: string;
  ogTitle: string;
  ogImageUrl: string;
  sitemapUrl: string;
  robotsUrl: string;
  llmsTxtUrl: string;
  gscProperty: string | null;
  sitemapNote: string;
  connections: SeoConnection[];
};

/** Public tag IDs safe to expose to the marketing shell (not verification secrets). */
export type PublicMarketingTags = {
  ga4MeasurementId: string;
  gtmId: string;
  clarityId: string;
  skipAnalytics: boolean;
  /** Ignore-IP list is set — client checks `/api/marketing/analytics-gate` before loading tags. */
  checkIgnoreIps: boolean;
};

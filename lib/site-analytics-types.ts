/**
 * Admin SEO analytics DTOs — client-safe (no googleapis).
 */

export type SiteAnalyticsRange = "7d" | "28d";

export type SiteAnalyticsSource = {
  connected: boolean;
  detail: string | null;
};

export type SiteAnalytics = {
  connected: boolean;
  range: SiteAnalyticsRange;
  ga4: SiteAnalyticsSource;
  gsc: SiteAnalyticsSource;
  visits: { sessions: number; users: number; pageviews: number };
  countries: { country: string; sessions: number }[];
  events: { name: string; label: string; count: number }[];
  indexedPages: {
    url: string;
    clicks: number;
    impressions: number;
    isNew: boolean;
  }[];
  queries: {
    query: string;
    clicks: number;
    impressions: number;
    ctr: number | null;
    position: number | null;
  }[];
  serviceAccountEmail: string | null;
  setupNote: string | null;
};

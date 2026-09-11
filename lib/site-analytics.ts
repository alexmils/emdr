/**
 * Public-site analytics (GA4 Data API + Search Console) for Admin → SEO.
 * Missing credentials return a structured disconnected payload — never throw to HTTP.
 */

import { google } from "googleapis";
import type { JWT } from "google-auth-library";
import {
  parseServiceAccountEmail,
  type PlatformSeoConfig,
} from "@/lib/seo-config";

const CACHE_TTL_MS = 5 * 60 * 1000;
const GA4_SCOPES = [
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/webmasters.readonly",
];

const EVENT_LABELS: Record<string, string> = {
  page_view: "Page view",
  session_start: "Visit started",
  first_visit: "First visit",
  user_engagement: "Time on page",
  scroll: "Scroll",
  click: "Click",
  file_download: "Download",
  view_search_results: "Site search",
  form_start: "Form started",
  form_submit: "Form sent",
};

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

type CacheEntry = { at: number; data: SiteAnalytics };
const cache = new Map<string, CacheEntry>();

export function parseAnalyticsRange(
  raw: string | null | undefined
): SiteAnalyticsRange {
  return (raw || "").trim().toLowerCase() === "28d" ? "28d" : "7d";
}

function rangeDays(range: SiteAnalyticsRange): number {
  return range === "28d" ? 28 : 7;
}

export function parseGa4PropertyId(
  raw: string | null | undefined
): string | null {
  let value = (raw || "").trim();
  if (!value) return null;
  if (value.toLowerCase().startsWith("properties/")) {
    value = value.split("/", 2)[1]?.trim() || "";
  }
  if (value.toUpperCase().startsWith("G-")) return null;
  if (/^\d+$/.test(value)) return value;
  return null;
}

function dateWindow(range: SiteAnalyticsRange): { start: string; end: string } {
  const days = rangeDays(range);
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(end.getUTCDate() - (days - 1));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function previousWindow(
  startIso: string,
  endIso: string
): { start: string; end: string } {
  const start = new Date(`${startIso}T00:00:00Z`);
  const end = new Date(`${endIso}T00:00:00Z`);
  const span = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  const prevEnd = new Date(start);
  prevEnd.setUTCDate(prevEnd.getUTCDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setUTCDate(prevEnd.getUTCDate() - (span - 1));
  return {
    start: prevStart.toISOString().slice(0, 10),
    end: prevEnd.toISOString().slice(0, 10),
  };
}

export function disconnectedSiteAnalytics(
  range: SiteAnalyticsRange,
  opts: {
    email?: string | null;
    ga4Detail?: string;
    gscDetail?: string;
  } = {}
): SiteAnalytics {
  const email = opts.email ?? null;
  const note = email
    ? "Connect Google Analytics. Add this service account as a Viewer on the Analytics property and as a user on Search Console, then set the GA4 property ID on Connections."
    : "Connect Google Analytics. Paste a Google service account JSON on Connections (Viewer on Analytics + user on Search Console), then set the GA4 property ID.";
  return {
    connected: false,
    range,
    ga4: { connected: false, detail: opts.ga4Detail || "Not connected" },
    gsc: { connected: false, detail: opts.gscDetail || "Not connected" },
    visits: { sessions: 0, users: 0, pageviews: 0 },
    countries: [],
    events: [],
    indexedPages: [],
    queries: [],
    serviceAccountEmail: email,
    setupNote: note,
  };
}

function loadCredentials(json: string): JWT | null {
  const t = json.trim();
  if (!t) return null;
  try {
    const parsed = JSON.parse(t) as {
      client_email?: string;
      private_key?: string;
    };
    if (!parsed.client_email || !parsed.private_key) return null;
    return new google.auth.JWT({
      email: parsed.client_email,
      key: parsed.private_key,
      scopes: GA4_SCOPES,
    });
  } catch {
    return null;
  }
}

function metricInt(
  row: { metricValues?: { value?: string | null }[] | null },
  index = 0
): number {
  const metrics = row.metricValues || [];
  if (index >= metrics.length) return 0;
  return Math.round(Number(metrics[index]?.value || "0"));
}

function dim(
  row: { dimensionValues?: { value?: string | null }[] | null },
  index = 0
): string {
  const dims = row.dimensionValues || [];
  return String(dims[index]?.value || "").trim();
}

async function fetchGa4(
  auth: JWT,
  propertyId: string,
  start: string,
  end: string
): Promise<{
  source: SiteAnalyticsSource;
  visits: SiteAnalytics["visits"];
  countries: SiteAnalytics["countries"];
  events: SiteAnalytics["events"];
}> {
  const analyticsdata = google.analyticsdata({ version: "v1beta", auth });
  const dateRanges = [{ startDate: start, endDate: end }];
  try {
    const totals = await analyticsdata.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges,
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
          { name: "screenPageViews" },
        ],
      },
    });
    const rows = totals.data.rows || [];
    const visits = rows[0]
      ? {
          sessions: metricInt(rows[0], 0),
          users: metricInt(rows[0], 1),
          pageviews: metricInt(rows[0], 2),
        }
      : { sessions: 0, users: 0, pageviews: 0 };

    const countries: SiteAnalytics["countries"] = [];
    const countryReport = await analyticsdata.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges,
        dimensions: [{ name: "country" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: "8",
      },
    });
    for (const row of countryReport.data.rows || []) {
      const name = dim(row);
      if (!name || name === "(not set)") continue;
      countries.push({ country: name, sessions: metricInt(row) });
    }

    const events: SiteAnalytics["events"] = [];
    const eventReport = await analyticsdata.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges,
        dimensions: [{ name: "eventName" }],
        metrics: [{ name: "eventCount" }],
        orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
        limit: "12",
      },
    });
    for (const row of eventReport.data.rows || []) {
      const name = dim(row);
      if (!name) continue;
      events.push({
        name,
        label:
          EVENT_LABELS[name] ||
          name.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()),
        count: metricInt(row),
      });
    }

    return {
      source: { connected: true, detail: null },
      visits,
      countries,
      events,
    };
  } catch (err) {
    console.warn("[site-analytics] GA4 failed", err);
    return {
      source: { connected: false, detail: "Could not read Analytics" },
      visits: { sessions: 0, users: 0, pageviews: 0 },
      countries: [],
      events: [],
    };
  }
}

async function fetchGsc(
  auth: JWT,
  siteUrl: string,
  start: string,
  end: string
): Promise<{
  source: SiteAnalyticsSource;
  indexedPages: SiteAnalytics["indexedPages"];
  queries: SiteAnalytics["queries"];
}> {
  try {
    const searchconsole = google.searchconsole({ version: "v1", auth });
    await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: start,
        endDate: end,
        rowLimit: 1,
        type: "web",
      },
    });

    const queryRes = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: start,
        endDate: end,
        dimensions: ["query"],
        rowLimit: 25,
        type: "web",
      },
    });
    const pageRes = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: start,
        endDate: end,
        dimensions: ["page"],
        rowLimit: 25,
        type: "web",
      },
    });
    const prev = previousWindow(start, end);
    const prevPagesRes = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: prev.start,
        endDate: prev.end,
        dimensions: ["page"],
        rowLimit: 25,
        type: "web",
      },
    });
    const prevPages = new Set(
      (prevPagesRes.data.rows || []).map((r) => String(r.keys?.[0] || ""))
    );

    const queries: SiteAnalytics["queries"] = [];
    for (const row of queryRes.data.rows || []) {
      const q = String(row.keys?.[0] || "").trim();
      if (!q) continue;
      queries.push({
        query: q,
        clicks: Math.round(Number(row.clicks || 0)),
        impressions: Math.round(Number(row.impressions || 0)),
        ctr: row.ctr != null ? Number(row.ctr) : null,
        position: row.position != null ? Number(row.position) : null,
      });
    }

    const indexedPages: SiteAnalytics["indexedPages"] = [];
    for (const row of pageRes.data.rows || []) {
      const url = String(row.keys?.[0] || "").trim();
      if (!url) continue;
      indexedPages.push({
        url,
        clicks: Math.round(Number(row.clicks || 0)),
        impressions: Math.round(Number(row.impressions || 0)),
        isNew: !prevPages.has(url),
      });
    }

    return {
      source: { connected: true, detail: null },
      indexedPages,
      queries,
    };
  } catch (err) {
    console.warn("[site-analytics] GSC failed", err);
    return {
      source: { connected: false, detail: "Could not read Search Console" },
      indexedPages: [],
      queries: [],
    };
  }
}

export async function fetchSiteAnalytics(
  seo: PlatformSeoConfig,
  rangeRaw?: string | null
): Promise<SiteAnalytics> {
  const range = parseAnalyticsRange(rangeRaw);
  const email = parseServiceAccountEmail(seo.googleServiceAccountJson);
  const cacheKey = `${range}:${seo.ga4PropertyId}:${seo.gscProperty}:${email || ""}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return hit.data;
  }

  const auth = loadCredentials(seo.googleServiceAccountJson);
  if (!auth) {
    return disconnectedSiteAnalytics(range, { email });
  }

  const propertyId = parseGa4PropertyId(seo.ga4PropertyId);
  const siteUrl = seo.gscProperty.trim();
  const { start, end } = dateWindow(range);

  let ga4Block = {
    source: {
      connected: false,
      detail: propertyId ? null : "Set GA4 property ID on Connections",
    } as SiteAnalyticsSource,
    visits: { sessions: 0, users: 0, pageviews: 0 },
    countries: [] as SiteAnalytics["countries"],
    events: [] as SiteAnalytics["events"],
  };
  if (propertyId) {
    ga4Block = await fetchGa4(auth, propertyId, start, end);
  }

  let gscBlock = {
    source: {
      connected: false,
      detail: siteUrl ? null : "Set Search Console property on Connections",
    } as SiteAnalyticsSource,
    indexedPages: [] as SiteAnalytics["indexedPages"],
    queries: [] as SiteAnalytics["queries"],
  };
  if (siteUrl) {
    gscBlock = await fetchGsc(auth, siteUrl, start, end);
  }

  const connected = ga4Block.source.connected || gscBlock.source.connected;
  const data: SiteAnalytics = {
    connected,
    range,
    ga4: ga4Block.source,
    gsc: gscBlock.source,
    visits: ga4Block.visits,
    countries: ga4Block.countries,
    events: ga4Block.events,
    indexedPages: gscBlock.indexedPages,
    queries: gscBlock.queries,
    serviceAccountEmail: email,
    setupNote: connected
      ? null
      : disconnectedSiteAnalytics(range, { email }).setupNote,
  };
  cache.set(cacheKey, { at: Date.now(), data });
  return data;
}

/** Test helper — clear in-memory cache. */
export function clearSiteAnalyticsCache(): void {
  cache.clear();
}

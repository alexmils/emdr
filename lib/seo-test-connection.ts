/**
 * Live connection checks for Admin → SEO → Connections.
 * Mirrors Admin AI “Test connection”: ping the provider and return which profile answered.
 */

import { google } from "googleapis";
import type { JWT } from "google-auth-library";
import {
  isValidClarityId,
  isValidGa4Id,
  isValidGtmId,
  parseServiceAccountEmail,
  type PlatformSeoConfig,
} from "@/lib/seo-config";
import { parseGa4PropertyId } from "@/lib/site-analytics";
import { parseAnalyticsIgnoreIps } from "@/lib/analytics-ignore";

const GA_SCOPES = [
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/webmasters.readonly",
];

export const SEO_TEST_CONN_IDS = [
  "ga4",
  "gsc",
  "gtm",
  "clarity",
  "bing",
  "ignore_ips",
] as const;

export type SeoTestConnId = (typeof SEO_TEST_CONN_IDS)[number];

export type SeoTestConnectionInput = {
  type: SeoTestConnId;
  ga4MeasurementId?: string;
  ga4PropertyId?: string;
  googleServiceAccountJson?: string;
  gscProperty?: string;
  gscVerification?: string;
  gtmId?: string;
  clarityId?: string;
  bingVerification?: string;
  ignoreIps?: string;
};

export type SeoTestConnectionResult = {
  ok: boolean;
  error?: string;
  /** Short headline, e.g. property display name. */
  profile?: string;
  /** Extra lines under Connection OK. */
  details?: string[];
};

export function isSeoTestConnId(value: unknown): value is SeoTestConnId {
  return (
    typeof value === "string" &&
    (SEO_TEST_CONN_IDS as readonly string[]).includes(value)
  );
}

function googleErrorMessage(err: unknown): string {
  if (err && typeof err === "object") {
    const e = err as {
      message?: string;
      response?: { data?: { error?: { message?: string; status?: string } } };
    };
    const api = e.response?.data?.error?.message;
    if (typeof api === "string" && api.trim()) {
      return api.trim().slice(0, 220);
    }
    if (typeof e.message === "string" && e.message.trim()) {
      return e.message.trim().slice(0, 220);
    }
  }
  return "Connection check failed";
}

function loadJwt(json: string): JWT | null {
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
      scopes: GA_SCOPES,
    });
  } catch {
    return null;
  }
}

/** Resolve draft secret or fall back to stored config. */
function resolveSecret(
  draft: string | undefined,
  stored: string
): string {
  const d = (draft || "").trim();
  if (d) return d;
  return stored.trim();
}

function todayMinusDays(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/** Loose IPv4 / IPv4-CIDR / IPv6 check for ignore list. */
export function isLikelyIpOrCidr(entry: string): boolean {
  const t = entry.trim();
  if (!t) return false;
  if (/^\d{1,3}(\.\d{1,3}){3}(\/\d{1,2})?$/.test(t)) {
    const [host, cidr] = t.split("/");
    const octets = host.split(".").map(Number);
    if (octets.some((n) => n > 255)) return false;
    if (cidr !== undefined) {
      const p = Number(cidr);
      if (!Number.isInteger(p) || p < 0 || p > 32) return false;
    }
    return true;
  }
  // Basic IPv6 / IPv6-CIDR
  if (t.includes(":")) {
    if (t.includes("/")) {
      const [addr, cidr] = t.split("/");
      const p = Number(cidr);
      if (!addr || !Number.isInteger(p) || p < 0 || p > 128) return false;
    }
    return /^[0-9a-fA-F:.]+$/.test(t.split("/")[0] || "");
  }
  return false;
}

async function fetchOk(
  url: string,
  opts: { requireBodyIncludes?: string } = {}
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
      headers: { Accept: "*/*" },
    });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }
    if (opts.requireBodyIncludes) {
      const text = await res.text();
      if (!text.includes(opts.requireBodyIncludes)) {
        return { ok: false, error: "Response did not match this ID" };
      }
    }
    return { ok: true };
  } catch (err) {
    const msg =
      err instanceof Error ? err.message.slice(0, 160) : "Network error";
    return { ok: false, error: msg };
  }
}

async function testGa4(
  input: SeoTestConnectionInput,
  stored: PlatformSeoConfig
): Promise<SeoTestConnectionResult> {
  const measurementId = (
    input.ga4MeasurementId ?? stored.ga4MeasurementId
  ).trim();
  const propertyRaw = (input.ga4PropertyId ?? stored.ga4PropertyId).trim();
  const saJson = resolveSecret(
    input.googleServiceAccountJson,
    stored.googleServiceAccountJson
  );
  const details: string[] = [];

  if (measurementId) {
    if (!isValidGa4Id(measurementId)) {
      return { ok: false, error: "Measurement ID must look like G-XXXXXXXX" };
    }
    details.push(`Measurement ${measurementId}`);
  }

  const propertyId = parseGa4PropertyId(propertyRaw);
  if (!propertyId && !measurementId) {
    return {
      ok: false,
      error: "Enter a measurement ID (G-…) and/or property ID",
    };
  }

  if (!propertyId) {
    // Public tag only — format OK; API profile needs property + SA
    return {
      ok: true,
      profile: measurementId,
      details: [
        ...details,
        "Format OK — add property ID + service account to verify the Analytics API profile",
      ],
    };
  }

  if (!saJson) {
    return {
      ok: false,
      error:
        "Paste a Google service account JSON to ping the Analytics property",
    };
  }

  const auth = loadJwt(saJson);
  if (!auth) {
    return { ok: false, error: "Service account JSON is invalid" };
  }

  const email = parseServiceAccountEmail(saJson);
  if (email) details.push(`Service account ${email}`);

  try {
    const admin = google.analyticsadmin({ version: "v1beta", auth });
    const prop = await admin.properties.get({
      name: `properties/${propertyId}`,
    });
    const displayName = (prop.data.displayName || "").trim() || `Property ${propertyId}`;
    const parent = (prop.data.parent || "").trim();
    if (parent) details.push(`Account ${parent.replace(/^accounts\//, "")}`);
    details.push(`Property ${propertyId}`);

    // Confirm Data API access with a tiny report
    const dataApi = google.analyticsdata({ version: "v1beta", auth });
    await dataApi.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [
          {
            startDate: todayMinusDays(7),
            endDate: todayMinusDays(0),
          },
        ],
        metrics: [{ name: "sessions" }],
        limit: "1",
      },
    });

    return {
      ok: true,
      profile: displayName,
      details,
    };
  } catch (err) {
    return { ok: false, error: googleErrorMessage(err) };
  }
}

async function testGsc(
  input: SeoTestConnectionInput,
  stored: PlatformSeoConfig
): Promise<SeoTestConnectionResult> {
  const siteUrl = (input.gscProperty ?? stored.gscProperty).trim();
  const saJson = resolveSecret(
    input.googleServiceAccountJson,
    stored.googleServiceAccountJson
  );
  const verification = resolveSecret(
    input.gscVerification,
    stored.gscVerification
  );
  const details: string[] = [];

  if (!siteUrl) {
    return { ok: false, error: "Enter a Search Console property URL" };
  }

  if (verification) {
    details.push("Verification code on file");
  }

  if (!saJson) {
    // Property + optional meta only
    if (
      siteUrl.startsWith("sc-domain:") ||
      siteUrl.startsWith("http://") ||
      siteUrl.startsWith("https://")
    ) {
      return {
        ok: true,
        profile: siteUrl,
        details: [
          ...details,
          "Property format OK — add a service account (Viewer on this property) to ping Google",
        ],
      };
    }
    return {
      ok: false,
      error: "Property must be https://… or sc-domain:example.com",
    };
  }

  const auth = loadJwt(saJson);
  if (!auth) {
    return { ok: false, error: "Service account JSON is invalid" };
  }

  const email = parseServiceAccountEmail(saJson);
  if (email) details.push(`Service account ${email}`);

  try {
    const searchconsole = google.searchconsole({ version: "v1", auth });
    try {
      const site = await searchconsole.sites.get({ siteUrl });
      const permission = (site.data.permissionLevel || "").trim();
      if (permission) details.push(`Permission ${permission}`);
    } catch {
      // sites.get can 404 on some property shapes — fall through to query probe
    }

    await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: todayMinusDays(7),
        endDate: todayMinusDays(1),
        rowLimit: 1,
        type: "web",
      },
    });

    return {
      ok: true,
      profile: siteUrl,
      details,
    };
  } catch (err) {
    return { ok: false, error: googleErrorMessage(err) };
  }
}

async function testGtm(
  input: SeoTestConnectionInput,
  stored: PlatformSeoConfig
): Promise<SeoTestConnectionResult> {
  const id = (input.gtmId ?? stored.gtmId).trim();
  if (!id) return { ok: false, error: "Enter a container ID (GTM-…)" };
  if (!isValidGtmId(id)) {
    return { ok: false, error: "Container ID must look like GTM-XXXXXXX" };
  }

  const ping = await fetchOk(
    `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`,
    { requireBodyIncludes: id }
  );
  if (!ping.ok) {
    return {
      ok: false,
      error: ping.error || "Could not reach Tag Manager for this ID",
    };
  }

  return {
    ok: true,
    profile: id,
    details: ["Published container script reachable"],
  };
}

async function testClarity(
  input: SeoTestConnectionInput,
  stored: PlatformSeoConfig
): Promise<SeoTestConnectionResult> {
  const id = (input.clarityId ?? stored.clarityId).trim();
  if (!id) return { ok: false, error: "Enter a Clarity project ID" };
  if (!isValidClarityId(id)) {
    return { ok: false, error: "Project ID looks invalid" };
  }

  const ping = await fetchOk(
    `https://www.clarity.ms/tag/${encodeURIComponent(id)}`
  );
  if (!ping.ok) {
    return {
      ok: false,
      error: ping.error || "Could not reach Clarity for this project",
    };
  }

  return {
    ok: true,
    profile: id,
    details: ["Clarity tag script reachable"],
  };
}

async function testBing(
  input: SeoTestConnectionInput,
  stored: PlatformSeoConfig
): Promise<SeoTestConnectionResult> {
  const code = resolveSecret(
    input.bingVerification,
    stored.bingVerification
  );
  if (!code) {
    return { ok: false, error: "Enter a Bing verification code" };
  }
  if (code.length < 8 || code.length > 200) {
    return { ok: false, error: "Verification code length looks wrong" };
  }
  if (!/^[A-Za-z0-9_-]+$/.test(code)) {
    return {
      ok: false,
      error: "Use the meta content value only (letters, numbers, _ -)",
    };
  }

  return {
    ok: true,
    profile: `Bing · …${code.slice(-4)}`,
    details: [
      "Code format OK — Bing confirms ownership after the meta tag is live on the site",
    ],
  };
}

async function testIgnoreIps(
  input: SeoTestConnectionInput,
  stored: PlatformSeoConfig
): Promise<SeoTestConnectionResult> {
  const raw = (input.ignoreIps ?? stored.ignoreIps).trim();
  if (
    !raw ||
    raw === "-" ||
    raw.toLowerCase() === "off" ||
    raw.toLowerCase() === "none"
  ) {
    return {
      ok: true,
      profile: "No IPs ignored",
      details: ["Empty list — all visitors can load marketing tags"],
    };
  }

  const list = parseAnalyticsIgnoreIps(raw);
  if (!list.length) {
    return { ok: false, error: "Could not parse any IP addresses" };
  }

  const bad = list.filter((ip) => !isLikelyIpOrCidr(ip));
  if (bad.length) {
    return {
      ok: false,
      error: `Invalid address: ${bad[0]}`,
    };
  }

  return {
    ok: true,
    profile: `${list.length} address${list.length === 1 ? "" : "es"}`,
    details: list.slice(0, 8).map((ip) => ip),
  };
}

/**
 * Ping one SEO connection using draft fields, falling back to stored secrets/IDs.
 * For GA4/GSC API checks, pass service account JSON in the draft or keep it stored.
 */
export async function testSeoConnection(
  input: SeoTestConnectionInput,
  stored: PlatformSeoConfig
): Promise<SeoTestConnectionResult> {
  switch (input.type) {
    case "ga4":
      return testGa4(input, stored);
    case "gsc":
      return testGsc(input, stored);
    case "gtm":
      return testGtm(input, stored);
    case "clarity":
      return testClarity(input, stored);
    case "bing":
      return testBing(input, stored);
    case "ignore_ips":
      return testIgnoreIps(input, stored);
    default:
      return { ok: false, error: "Unknown connection" };
  }
}

import { clientIpFromHeaders } from "@/lib/analytics-ignore";
import { normalizeCountryCode } from "@/lib/emergency-by-country";

export type GeoCountryResult = {
  countryCode: string | null;
  source: "cf-ipcountry" | "ip-lookup" | "none";
};

const PRIVATE_IP =
  /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|fc|fd|fe80)/i;

type CacheEntry = { code: string | null; expires: number };
const ipCountryCache = new Map<string, CacheEntry>();
const CACHE_MS = 60 * 60 * 1000;

/**
 * Prefer Cloudflare `CF-IPCountry` (prod behind CF).
 * Fallback: short IP→country lookup when we have a public client IP.
 */
export async function resolveRequestCountry(
  request: Request
): Promise<GeoCountryResult> {
  const cf = normalizeCountryCode(request.headers.get("cf-ipcountry"));
  if (cf) {
    return { countryCode: cf, source: "cf-ipcountry" };
  }

  const ip = clientIpFromHeaders(request.headers);
  if (!ip || PRIVATE_IP.test(ip)) {
    return { countryCode: null, source: "none" };
  }

  const cached = ipCountryCache.get(ip);
  if (cached && cached.expires > Date.now()) {
    return {
      countryCode: cached.code,
      source: cached.code ? "ip-lookup" : "none",
    };
  }

  const code = await lookupCountryByIp(ip);
  ipCountryCache.set(ip, { code, expires: Date.now() + CACHE_MS });
  return {
    countryCode: code,
    source: code ? "ip-lookup" : "none",
  };
}

async function lookupCountryByIp(ip: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2000);
  try {
    // ip-api.com: free non-commercial, fields-limited JSON over HTTP.
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,countryCode`,
      { signal: controller.signal, cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      status?: string;
      countryCode?: string;
    };
    if (data.status !== "success") return null;
    return normalizeCountryCode(data.countryCode ?? null);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

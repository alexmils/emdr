import { clientIpFromHeaders } from "@/lib/analytics-ignore";
import { normalizeCountryCode } from "@/lib/emergency-by-country";

export type GeoCountryResult = {
  countryCode: string | null;
  source: "cf-ipcountry" | "ip-lookup" | "none";
};

type CacheEntry = { code: string | null; expires: number };
const ipCountryCache = new Map<string, CacheEntry>();
const CACHE_MS = 60 * 60 * 1000;
const CACHE_MAX = 500;

/** IPv4 dotted-quad only (no hostnames). */
const IPV4 =
  /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d{1,9})\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d{1,9})$/;

/**
 * True for publicly routable client IPs we may send to a geo API.
 * Rejects private, loopback, link-local, CGNAT, and non-IPv4 (keep allowlist tight).
 */
export function isPublicClientIp(ip: string): boolean {
  const raw = ip.trim();
  if (!IPV4.test(raw)) return false;
  const parts = raw.split(".").map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return false;
  }
  const [a, b] = parts;
  if (a === 10) return false;
  if (a === 127) return false;
  if (a === 0) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 100 && b >= 64 && b <= 127) return false; // CGNAT
  if (a >= 224) return false; // multicast / reserved
  return true;
}

function cacheSet(ip: string, code: string | null) {
  if (ipCountryCache.size >= CACHE_MAX) {
    const oldest = ipCountryCache.keys().next().value;
    if (oldest !== undefined) ipCountryCache.delete(oldest);
  }
  ipCountryCache.set(ip, { code, expires: Date.now() + CACHE_MS });
}

/**
 * Prefer Cloudflare `CF-IPCountry` (prod behind CF).
 * Fallback: HTTPS IP→country lookup only for validated public IPv4.
 */
export async function resolveRequestCountry(
  request: Request
): Promise<GeoCountryResult> {
  const cf = normalizeCountryCode(request.headers.get("cf-ipcountry"));
  if (cf) {
    return { countryCode: cf, source: "cf-ipcountry" };
  }

  const ip = clientIpFromHeaders(request.headers);
  if (!ip || !isPublicClientIp(ip)) {
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
  cacheSet(ip, code);
  return {
    countryCode: code,
    source: code ? "ip-lookup" : "none",
  };
}

async function lookupCountryByIp(ip: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2000);
  try {
    // HTTPS JSON; path is a validated IPv4 only.
    const res = await fetch(
      `https://api.country.is/${encodeURIComponent(ip)}`,
      { signal: controller.signal, cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { country?: string };
    return normalizeCountryCode(data.country ?? null);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

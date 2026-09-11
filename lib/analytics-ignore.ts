/** Skip public-site analytics tags for listed client IPs. */

export type HeadersLike = {
  get(name: string): string | null;
};

/** Empty default — admin sets ignore list in SEO → Connections. */
export function parseAnalyticsIgnoreIps(
  raw: string | undefined | null
): string[] {
  if (raw === undefined || raw === null) return [];
  const text = raw.trim();
  if (
    !text ||
    text === "-" ||
    text.toLowerCase() === "off" ||
    text.toLowerCase() === "none"
  ) {
    return [];
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of text.split(/[,\s]+/)) {
    const ip = part.trim();
    if (!ip || seen.has(ip)) continue;
    seen.add(ip);
    out.push(ip);
  }
  return out;
}

function stripIpv6Mapped(ip: string): string {
  const t = ip.trim();
  if (t.toLowerCase().startsWith("::ffff:")) {
    return t.slice(7);
  }
  return t;
}

export function clientIpFromHeaders(headers: HeadersLike): string {
  const forwarded = (headers.get("x-forwarded-for") || "").trim();
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return stripIpv6Mapped(first);
  }
  const realIp = (headers.get("x-real-ip") || "").trim();
  if (realIp) return stripIpv6Mapped(realIp);
  const cf = (headers.get("cf-connecting-ip") || "").trim();
  if (cf) return stripIpv6Mapped(cf);
  return "";
}

export function isIgnoredAnalyticsIp(
  clientIp: string,
  ignoreList: readonly string[]
): boolean {
  const ip = stripIpv6Mapped(clientIp);
  if (!ip) return false;
  return ignoreList.some((entry) => stripIpv6Mapped(entry) === ip);
}

export function shouldSkipMarketingAnalytics(
  headers: HeadersLike,
  ignoreIpsRaw: string
): boolean {
  const list = parseAnalyticsIgnoreIps(ignoreIpsRaw);
  if (!list.length) return false;
  return isIgnoredAnalyticsIp(clientIpFromHeaders(headers), list);
}

export function maskIpForDisplay(ip: string): string {
  const t = stripIpv6Mapped(ip);
  const parts = t.split(".");
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}...`;
  }
  if (t.includes(":")) {
    const segs = t.split(":");
    return `${segs.slice(0, 2).join(":")}:•:•`;
  }
  return t ? "••••" : "";
}

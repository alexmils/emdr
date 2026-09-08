/** Product console lives under /app; frontend + legal stay at site root. */
export const APP_BASE = "/app";
export const LOGIN_PATH = `${APP_BASE}/login`;

/** Prefix a console path: appPath("/settings") → "/app/settings". */
export function appPath(path: string = "/"): string {
  if (!path || path === "/") return APP_BASE;
  const p = path.startsWith("/") ? path : `/${path}`;
  if (p === APP_BASE || p.startsWith(`${APP_BASE}/`)) return p;
  return `${APP_BASE}${p}`;
}

/**
 * Post-login / deep-link destinations only: must be an in-app path under `/app`.
 * Rejects `/`, `/login`, `//…`, absolute URLs, and anything outside the console.
 */
export function safeAppNext(
  candidate: string | null | undefined,
  fallback: string = APP_BASE
): string {
  const raw = (candidate ?? "").trim();
  const fb =
    fallback === APP_BASE ||
    fallback.startsWith(`${APP_BASE}/`) ||
    fallback.startsWith(`${APP_BASE}?`)
      ? fallback
      : APP_BASE;
  if (!raw) return fb;
  // Protocol-relative or absolute / non-path values.
  if (
    raw.startsWith("//") ||
    /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw) ||
    !raw.startsWith("/")
  ) {
    return fb;
  }
  // Path must be /app, /app/…, or /app?… (not /apple, /application, …).
  if (
    raw === APP_BASE ||
    raw.startsWith(`${APP_BASE}/`) ||
    raw.startsWith(`${APP_BASE}?`)
  ) {
    return raw;
  }
  return fb;
}

/** True when pathname is the product console (not frontend, not /apple). */
export function isAppConsolePath(pathname: string): boolean {
  return (
    pathname === APP_BASE ||
    pathname.startsWith(`${APP_BASE}/`) ||
    pathname.startsWith(`${APP_BASE}?`)
  );
}

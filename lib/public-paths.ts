import { APP_BASE, LOGIN_PATH, isAppConsolePath } from "@/lib/app-base";

const FRONTEND_EXACT = new Set(["/", ""]);

const FRONTEND_PREFIXES = [
  "/privacy",
  "/terms",
  "/about",
  "/emdr",
  "/resources",
] as const;

const AUTH_PUBLIC_PREFIXES = [
  LOGIN_PATH,
  `${APP_BASE}/forgot-password`,
  `${APP_BASE}/reset-password`,
  `${APP_BASE}/create-password`,
  `${APP_BASE}/create-account`,
] as const;

const API_PUBLIC_PREFIXES = [
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/me",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/create-password",
  "/api/auth/register",
  "/api/auth/google",
  "/api/auth/passkey/login",
  "/api/webhooks/stripe",
] as const;

/** Exact paths that never require a session (no file extension). */
const PUBLIC_EXACT = new Set(["/favicon.ico", "/og-image"]);

const PUBLIC_PREFIXES = ["/brand-assets/"] as const;

/** Frontend pages that never require login. */
export function isFrontendPublicPath(pathname: string): boolean {
  if (FRONTEND_EXACT.has(pathname)) return true;
  return FRONTEND_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

/** Auth screens under /app that do not require a session. */
export function isAuthPublicPath(pathname: string): boolean {
  return AUTH_PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

/**
 * Paths that middleware may serve without a session cookie.
 * Includes frontend, auth screens, public auth APIs, and static/API probes.
 */
export function isUnauthenticatedPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (isFrontendPublicPath(pathname)) return true;
  if (isAuthPublicPath(pathname)) return true;
  if (API_PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.includes(".")) return true;
  return false;
}

/**
 * On 401, only bounce to login from the product console —
 * never from frontend `/` or `/privacy`.
 */
export function shouldRedirectToLoginOn401(pathname: string): boolean {
  if (!isAppConsolePath(pathname)) return false;
  if (isAuthPublicPath(pathname)) return false;
  return true;
}

/** Legacy console bookmarks before the /app prefix. */
export const LEGACY_CONSOLE_PREFIXES = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/create-password",
  "/create-account",
  "/settings",
  "/billing",
  "/onboarding",
] as const;

export function legacyConsolePath(pathname: string): string | null {
  for (const prefix of LEGACY_CONSOLE_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return `${APP_BASE}${pathname}`;
    }
  }
  return null;
}

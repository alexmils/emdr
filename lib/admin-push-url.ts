/**
 * Restrict notification click targets to same-origin /admin paths.
 * Used by the admin service worker (mirrored in public/admin/sw.js).
 */
export function safeAdminPushPath(
  raw: unknown,
  origin = "https://nurahelp.com"
): string {
  const fallback = "/admin/help";
  if (typeof raw !== "string" || !raw.trim()) return fallback;
  try {
    const u = new URL(raw.trim(), origin);
    if (u.origin !== new URL(origin).origin) return fallback;
    if (!u.pathname.startsWith("/admin")) return fallback;
    return `${u.pathname}${u.search}${u.hash}`;
  } catch {
    return fallback;
  }
}

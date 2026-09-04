import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import {
  ROLE_SYNC_COOKIE,
  ROLE_SYNC_MAX_AGE_SEC,
} from "@/lib/auth/role-sync";
import { canManagePlatformSettings, isAdminRole, type UserRole } from "@/lib/roles";

const PUBLIC_PREFIXES = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/create-password",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/me",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/create-password",
  "/api/webhooks/stripe",
];

const PUBLIC_EXACT = ["/favicon.ico"];
const SYNC_SESSION_PATH = "/api/auth/sync-session";

function jwtRole(session: { role?: UserRole }): UserRole {
  if (session.role === "platform_admin") return "platform_admin";
  if (session.role === "support") return "support";
  return "user";
}

function needsRoleSync(pathname: string, session: { role?: UserRole }): boolean {
  return (
    isAdminRole(jwtRole(session)) ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin")
  );
}

function hasFreshRoleSync(request: NextRequest): boolean {
  return request.cookies.get(ROLE_SYNC_COOKIE)?.value === "1";
}

/**
 * Sync JWT role from DB at most once per ROLE_SYNC_MAX_AGE_SEC window,
 * and only on document navigations — never on /api/* (admin pages fire many
 * parallel APIs; each used to nest another sync-session and overload Turbopack).
 */
function shouldFetchDbRole(
  request: NextRequest,
  pathname: string,
  session: { role?: UserRole }
): boolean {
  if (!needsRoleSync(pathname, session)) return false;
  if (pathname.startsWith("/api/")) return false;
  if (hasFreshRoleSync(request)) return false;
  return true;
}

function markRoleSynced(response: NextResponse): NextResponse {
  response.cookies.set({
    name: ROLE_SYNC_COOKIE,
    value: "1",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ROLE_SYNC_MAX_AGE_SEC,
  });
  return response;
}

async function resolveRoleFromDb(
  request: NextRequest
): Promise<{ role: UserRole | null; setCookies: string[]; synced: boolean }> {
  const session = await getSessionFromRequest(request);
  if (!session) return { role: null, setCookies: [], synced: false };

  try {
    const syncUrl = new URL(SYNC_SESSION_PATH, request.url);
    const res = await fetch(syncUrl, {
      headers: {
        cookie: request.headers.get("cookie") ?? "",
      },
    });

    if (!res.ok) return { role: jwtRole(session), setCookies: [], synced: false };

    const data = (await res.json()) as { role?: UserRole };
    const role =
      data.role === "platform_admin"
        ? "platform_admin"
        : data.role === "support"
          ? "support"
          : "user";
    const setCookies =
      typeof res.headers.getSetCookie === "function"
        ? res.headers.getSetCookie()
        : res.headers.get("set-cookie")
          ? [res.headers.get("set-cookie")!]
          : [];

    return { role, setCookies, synced: true };
  } catch {
    return { role: jwtRole(session), setCookies: [], synced: false };
  }
}

function withCookies(response: NextResponse, setCookies: string[], synced: boolean) {
  for (const cookie of setCookies) {
    response.headers.append("set-cookie", cookie);
  }
  if (synced) markRoleSynced(response);
  return response;
}

function isSupportWriteBlocked(pathname: string, method: string) {
  if (method === "GET" || method === "HEAD") return false;
  return pathname.startsWith("/api/admin");
}

function isSupportPageBlocked(pathname: string) {
  return (
    pathname.startsWith("/admin/platform") ||
    pathname.startsWith("/admin/email") ||
    pathname.startsWith("/admin/ai") ||
    pathname.startsWith("/api/admin/platform") ||
    pathname.startsWith("/api/admin/email")
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_EXACT.includes(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    if (pathname.startsWith("/login")) {
      const session = await getSessionFromRequest(request);
      if (session) {
        const { role, setCookies, synced } = await resolveRoleFromDb(request);
        const dest = isAdminRole(role ?? "user") ? "/admin" : "/";
        const response = NextResponse.redirect(new URL(dest, request.url));
        return withCookies(response, setCookies, synced);
      }
    }
    return NextResponse.next();
  }

  if (pathname === SYNC_SESSION_PATH) {
    return NextResponse.next();
  }

  const session = await getSessionFromRequest(request);
  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  const sync = shouldFetchDbRole(request, pathname, session);
  const { role, setCookies, synced } = sync
    ? await resolveRoleFromDb(request)
    : { role: jwtRole(session), setCookies: [] as string[], synced: false };

  if (role === "platform_admin" || role === "support") {
    const adminAllowed =
      pathname.startsWith("/admin") ||
      pathname.startsWith("/api/admin") ||
      pathname.startsWith("/api/auth/");
    if (!adminAllowed) {
      if (pathname.startsWith("/api/")) {
        return withCookies(
          NextResponse.json({ error: "Forbidden" }, { status: 403 }),
          setCookies,
          synced
        );
      }
      return withCookies(
        NextResponse.redirect(new URL("/admin", request.url)),
        setCookies,
        synced
      );
    }
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (!isAdminRole(role ?? "user")) {
      if (pathname.startsWith("/api/")) {
        return withCookies(
          NextResponse.json({ error: "Forbidden" }, { status: 403 }),
          setCookies,
          synced
        );
      }
      return withCookies(
        NextResponse.redirect(new URL("/", request.url)),
        setCookies,
        synced
      );
    }

    if (role === "support") {
      if (
        isSupportPageBlocked(pathname) ||
        isSupportWriteBlocked(pathname, request.method)
      ) {
        if (pathname.startsWith("/api/")) {
          return withCookies(
            NextResponse.json({ error: "Forbidden" }, { status: 403 }),
            setCookies,
            synced
          );
        }
        return withCookies(
          NextResponse.redirect(new URL("/admin", request.url)),
          setCookies,
          synced
        );
      }
    }
  }

  if (
    pathname.startsWith("/admin/platform") ||
    pathname.startsWith("/api/admin/platform")
  ) {
    if (!canManagePlatformSettings(role ?? "user")) {
      if (pathname.startsWith("/api/")) {
        return withCookies(
          NextResponse.json({ error: "Forbidden" }, { status: 403 }),
          setCookies,
          synced
        );
      }
      return withCookies(
        NextResponse.redirect(new URL("/admin", request.url)),
        setCookies,
        synced
      );
    }
  }

  return withCookies(NextResponse.next(), setCookies, synced);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};

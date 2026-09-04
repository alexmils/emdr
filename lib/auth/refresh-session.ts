import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  createSessionToken,
  getSession,
  getSessionFromRequest,
  sessionCookieOptions,
  type SessionPayload,
} from "@/lib/auth/session";
import { getUserSessionById } from "@/lib/users";
import type { UserRole } from "@/lib/roles";

export type ResolvedSession = {
  userId: string;
  email: string;
  name?: string;
  role: UserRole;
  tokenStale: boolean;
};

export async function resolveSessionUser(
  session: SessionPayload
): Promise<ResolvedSession | null> {
  const user = await getUserSessionById(session.sub);
  if (!user) return null;

  return {
    userId: user.id,
    email: user.email,
    name: user.name ?? undefined,
    role: user.role,
    tokenStale: session.role !== user.role,
  };
}

export async function refreshSessionCookie(
  response: NextResponse,
  session: SessionPayload,
  resolved: ResolvedSession
): Promise<NextResponse> {
  if (!resolved.tokenStale) return response;

  const token = await createSessionToken({
    sub: resolved.userId,
    email: resolved.email,
    name: resolved.name,
    role: resolved.role,
  });
  response.cookies.set(sessionCookieOptions(token));
  return response;
}

/** Load DB role and refresh JWT cookie when role changed. */
export async function syncSessionFromRequest(
  request?: NextRequest
): Promise<{ resolved: ResolvedSession | null; session: SessionPayload | null }> {
  const session = request
    ? await getSessionFromRequest(request)
    : await getSession();
  if (!session) return { resolved: null, session: null };

  const resolved = await resolveSessionUser(session);
  return { resolved, session };
}

export async function syncSessionResponse(
  request?: NextRequest
): Promise<NextResponse> {
  const { resolved, session } = await syncSessionFromRequest(request);
  if (!resolved || !session) {
    return NextResponse.json({ role: null }, { status: 401 });
  }

  let response: NextResponse = NextResponse.json({
    role: resolved.role,
    userId: resolved.userId,
    refreshed: resolved.tokenStale,
  });
  response = await refreshSessionCookie(response, session, resolved);
  return response;
}

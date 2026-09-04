import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  getUserById,
  publicUser,
  updateUserProfile,
} from "@/lib/users";
import {
  refreshSessionCookie,
  resolveSessionUser,
} from "@/lib/auth/refresh-session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }

  const resolved = await resolveSessionUser(session);
  if (!resolved) {
    return NextResponse.json({ user: null });
  }

  const user = await getUserById(resolved.userId);
  if (!user) {
    return NextResponse.json({ user: null });
  }

  let response: NextResponse = NextResponse.json({ user: publicUser(user) });
  response = await refreshSessionCookie(response, session, resolved);
  return response;
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolved = await resolveSessionUser(session);
  if (!resolved) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: unknown;
    avatarUrl?: unknown;
  };

  const patch: { name?: string | null; avatarUrl?: string | null } = {};
  if (body.name !== undefined) {
    if (body.name !== null && typeof body.name !== "string") {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }
    patch.name = body.name;
  }
  if (body.avatarUrl !== undefined) {
    if (body.avatarUrl !== null && typeof body.avatarUrl !== "string") {
      return NextResponse.json({ error: "Invalid avatar" }, { status: 400 });
    }
    patch.avatarUrl = body.avatarUrl;
  }

  try {
    const user = await updateUserProfile(resolved.userId, patch);
    if (!user) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ user: publicUser(user) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 400 }
    );
  }
}

import { getSession } from "@/lib/auth/session";
import { getUserById, type User } from "@/lib/users";
import { withRlsSession, type RlsContext } from "@/lib/rls";
import { NextResponse } from "next/server";
import {
  canManagePlatformSettings,
  canViewAdmin,
  canWriteAdminUsers,
  isPlatformAdmin,
  type UserRole,
} from "@/lib/roles";

export type AuthContext = {
  user: User;
  rls: RlsContext;
};

export async function requireAuth(): Promise<AuthContext | NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserById(session.sub);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.status === "disabled") {
    return NextResponse.json({ error: "Account disabled" }, { status: 403 });
  }

  return {
    user,
    rls: { userId: user.id, role: user.role },
  };
}

export async function withAuth<T>(
  fn: (ctx: AuthContext) => Promise<T>
): Promise<T | NextResponse> {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    return await withRlsSession(auth.rls, () => fn(auth));
  } catch (err) {
    console.error("[withAuth]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function requireAdminAccess(): Promise<AuthContext | NextResponse> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  if (!canViewAdmin(auth.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return auth;
}

export async function requirePlatformAdmin(): Promise<AuthContext | NextResponse> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  if (!isPlatformAdmin(auth.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return auth;
}

export async function requirePlatformAdminWrite(): Promise<
  AuthContext | NextResponse
> {
  const auth = await requirePlatformAdmin();
  if (auth instanceof NextResponse) return auth;
  if (!canWriteAdminUsers(auth.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return auth;
}

export async function requirePlatformSettingsAccess(): Promise<
  AuthContext | NextResponse
> {
  const auth = await requirePlatformAdmin();
  if (auth instanceof NextResponse) return auth;
  if (!canManagePlatformSettings(auth.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return auth;
}

export function isAuthContext(v: AuthContext | NextResponse): v is AuthContext {
  return !(v instanceof NextResponse);
}

export type { UserRole };

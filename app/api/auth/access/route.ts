import { NextResponse } from "next/server";
import { requireAuth, isAuthContext } from "@/lib/api-auth";
import {
  getEntitlementForUser,
  publicEntitlement,
} from "@/lib/entitlements";
import { ensureUserAccessStub } from "@/lib/user-access";
import { resolveAccessRedirect } from "@/lib/access-gate";

/** Lightweight access check for middleware + client gates (DB-backed). */
export async function GET() {
  const auth = await requireAuth();
  if (!isAuthContext(auth)) return auth;

  if (auth.user.role === "user") {
    await ensureUserAccessStub(auth.user.id);
  }

  const entitlement = await getEntitlementForUser({
    userId: auth.user.id,
    role: auth.user.role,
    onboardingCompletedAt: auth.user.onboardingCompletedAt,
  });

  const redirectTo = resolveAccessRedirect({
    role: auth.user.role,
    needsOnboarding: entitlement.needsOnboarding,
    needsPayment: entitlement.needsPayment,
    canUseApp: entitlement.canUseApp,
  });

  return NextResponse.json({
    role: auth.user.role,
    ...publicEntitlement(entitlement),
    redirectTo,
  });
}

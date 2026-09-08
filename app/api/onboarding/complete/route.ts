import { NextResponse } from "next/server";
import { requireAuth, isAuthContext } from "@/lib/api-auth";
import { markOnboardingCompleted, publicUser } from "@/lib/users";
import {
  getEntitlementForUser,
  publicEntitlement,
} from "@/lib/entitlements";

/** Mark the short post-checkout tutorial as done. */
export async function POST() {
  const auth = await requireAuth();
  if (!isAuthContext(auth)) return auth;

  const entitlement = await getEntitlementForUser({
    userId: auth.user.id,
    role: auth.user.role,
    onboardingCompletedAt: auth.user.onboardingCompletedAt,
  });

  if (!entitlement.canUseApp && entitlement.accessTier === "none") {
    return NextResponse.json(
      {
        error: "Complete checkout before finishing onboarding",
        code: "needs_payment",
        entitlement: publicEntitlement(entitlement),
      },
      { status: 402 }
    );
  }

  if (
    entitlement.accessTier !== "legacy" &&
    entitlement.accessTier !== "trialing" &&
    entitlement.accessTier !== "active"
  ) {
    return NextResponse.json(
      {
        error: "Subscription required",
        code: "needs_payment",
        entitlement: publicEntitlement(entitlement),
      },
      { status: 402 }
    );
  }

  const user = await markOnboardingCompleted(auth.user.id);
  const next = await getEntitlementForUser({
    userId: auth.user.id,
    role: auth.user.role,
    onboardingCompletedAt: user?.onboardingCompletedAt ?? new Date().toISOString(),
  });

  return NextResponse.json({
    user: user ? publicUser(user) : null,
    entitlement: publicEntitlement(next),
  });
}

import { NextResponse } from "next/server";
import { requireAuth, isAuthContext } from "@/lib/api-auth";
import { resolveStripeClient } from "@/lib/stripe";
import {
  getSubscriptionByUserId,
  mapStripeSubscriptionWithConfig,
  syncSubscriptionFromStripe,
} from "@/lib/stripe-admin";
import {
  getEntitlementForUser,
  publicEntitlement,
} from "@/lib/entitlements";

/**
 * End an active trial early so usage limits lift and billing starts.
 * Used by the in-app Upgrade modal when the user already has a Checkout subscription.
 */
export async function POST() {
  const auth = await requireAuth();
  if (!isAuthContext(auth)) return auth;

  const sub = await getSubscriptionByUserId(auth.user.id);
  if (!sub?.stripe_subscription_id) {
    return NextResponse.json(
      { error: "No subscription to activate", code: "needs_checkout" },
      { status: 400 }
    );
  }

  if (sub.status === "active") {
    const entitlement = await getEntitlementForUser({
      userId: auth.user.id,
      role: auth.user.role,
      onboardingCompletedAt: auth.user.onboardingCompletedAt,
    });
    return NextResponse.json({
      ok: true,
      alreadyActive: true,
      entitlement: publicEntitlement(entitlement),
    });
  }

  if (sub.status !== "trialing") {
    return NextResponse.json(
      { error: "Subscription is not in trial", code: "not_trialing" },
      { status: 400 }
    );
  }

  const resolved = await resolveStripeClient({
    livemode: sub.stripe_livemode,
    objectId: sub.stripe_subscription_id,
  });
  if (!resolved) {
    return NextResponse.json(
      { error: "Stripe is not configured for this subscription" },
      { status: 503 }
    );
  }

  try {
    const updated = await resolved.stripe.subscriptions.update(
      sub.stripe_subscription_id,
      { trial_end: "now" }
    );
    const mapped = await mapStripeSubscriptionWithConfig(
      updated,
      resolved.livemode
    );
    const created =
      typeof (updated as { created?: number }).created === "number"
        ? (updated as { created: number }).created
        : undefined;
    await syncSubscriptionFromStripe({
      userId: auth.user.id,
      ...mapped,
      stripeLivemode: resolved.livemode,
      // Prefer Stripe object time; omit rather than Date.now() so webhooks stay authoritative.
      eventCreatedAt: created,
    });
    const entitlement = await getEntitlementForUser({
      userId: auth.user.id,
      role: auth.user.role,
      onboardingCompletedAt: auth.user.onboardingCompletedAt,
    });
    return NextResponse.json({
      ok: true,
      entitlement: publicEntitlement(entitlement),
    });
  } catch (err) {
    console.error("[billing/activate]", err);
    return NextResponse.json(
      { error: "Could not activate subscription" },
      { status: 500 }
    );
  }
}

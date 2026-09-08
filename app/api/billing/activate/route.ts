import { NextResponse } from "next/server";
import { requireAuth, isAuthContext } from "@/lib/api-auth";
import { getStripe } from "@/lib/stripe";
import {
  getSubscriptionByUserId,
  mapStripeSubscription,
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

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 }
    );
  }

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

  try {
    const updated = await stripe.subscriptions.update(sub.stripe_subscription_id, {
      trial_end: "now",
    });
    const mapped = mapStripeSubscription(updated);
    await syncSubscriptionFromStripe({
      userId: auth.user.id,
      ...mapped,
      eventCreatedAt: Math.floor(Date.now() / 1000),
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

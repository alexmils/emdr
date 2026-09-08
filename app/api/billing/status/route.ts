import { NextResponse } from "next/server";
import { requireAuth, isAuthContext } from "@/lib/api-auth";
import {
  getEntitlementForUser,
  publicEntitlement,
} from "@/lib/entitlements";
import {
  getStripe,
  getStripeConfig,
  isStripeConfigured,
  resolveBillingPlans,
} from "@/lib/stripe";
import {
  syncSubscriptionFromStripe,
  mapStripeSubscriptionWithConfig,
} from "@/lib/stripe-admin";
import { markOnboardingCompleted } from "@/lib/users";
import { getPlatformSettings } from "@/lib/platform-settings";
import { publicAdsConfig } from "@/lib/ads";

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (!isAuthContext(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  // Verify Checkout success server-side when returning from Stripe.
  if (sessionId) {
    const stripe = await getStripe();
    if (stripe) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ["subscription"],
        });
        const metaUser =
          session.client_reference_id ||
          session.metadata?.user_id ||
          null;
        if (metaUser === auth.user.id && session.subscription) {
          const subObj =
            typeof session.subscription === "string"
              ? await stripe.subscriptions.retrieve(session.subscription)
              : session.subscription;
          const mapped = await mapStripeSubscriptionWithConfig(subObj);
          await syncSubscriptionFromStripe({
            userId: auth.user.id,
            ...mapped,
            eventCreatedAt: Math.floor(Date.now() / 1000),
          });
          if (!auth.user.onboardingCompletedAt) {
            await markOnboardingCompleted(auth.user.id);
            auth.user.onboardingCompletedAt = new Date().toISOString();
          }
        }
      } catch (err) {
        console.error("[billing/status] session verify", err);
      }
    }
  }

  const entitlement = await getEntitlementForUser({
    userId: auth.user.id,
    role: auth.user.role,
    onboardingCompletedAt: auth.user.onboardingCompletedAt,
  });
  const platform = await getPlatformSettings();
  const pub = publicEntitlement(entitlement);
  const stripeCfg = await getStripeConfig();

  return NextResponse.json({
    ...pub,
    ads: publicAdsConfig(platform.ads, pub.isTrialLimited),
    stripeConfigured: await isStripeConfigured(),
    plans: resolveBillingPlans(stripeCfg),
  });
}

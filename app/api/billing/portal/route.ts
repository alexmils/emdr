import { NextResponse } from "next/server";
import { requireAuth, isAuthContext } from "@/lib/api-auth";
import { getPublicAppUrl } from "@/lib/platform-settings";
import { getStripe } from "@/lib/stripe";
import { getSubscriptionByUserId } from "@/lib/stripe-admin";

export async function POST() {
  const auth = await requireAuth();
  if (!isAuthContext(auth)) return auth;

  const stripe = await getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 }
    );
  }

  const sub = await getSubscriptionByUserId(auth.user.id);
  if (!sub?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No billing customer on file" },
      { status: 400 }
    );
  }

  try {
    const baseUrl = await getPublicAppUrl();
    const portal = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${baseUrl}/app/billing`,
    });
    return NextResponse.json({ url: portal.url });
  } catch (err) {
    console.error("[stripe/portal]", err);
    return NextResponse.json(
      { error: "Could not open billing portal" },
      { status: 500 }
    );
  }
}

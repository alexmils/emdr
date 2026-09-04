import { NextResponse } from "next/server";
import { requireAuth, isAuthContext } from "@/lib/api-auth";
import { getPublicAppUrl } from "@/lib/platform-settings";

export async function POST() {
  const auth = await requireAuth();
  if (!isAuthContext(auth)) return auth;

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!stripeKey || !priceId) {
    return NextResponse.json(
      { error: "Stripe checkout is not configured" },
      { status: 503 }
    );
  }

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey);
    const baseUrl = await getPublicAppUrl();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: auth.user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/billing?success=1`,
      cancel_url: `${baseUrl}/billing?canceled=1`,
      subscription_data: {
        metadata: { user_email: auth.user.email },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/checkout]", err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}

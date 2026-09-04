import { NextResponse } from "next/server";
import { syncSubscriptionFromStripe } from "@/lib/stripe-admin";
import { getUserByEmail } from "@/lib/users";

/** Stripe webhook — sync subscription state when configured. */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!secret || !stripeKey) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  try {
    const body = await request.text();
    const sig = request.headers.get("stripe-signature");
    if (!sig) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey);
    const event = stripe.webhooks.constructEvent(body, sig, secret);

    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.created"
    ) {
      const sub = event.data.object as {
        status: string;
        customer: string;
        items: { data: { price: { unit_amount: number | null; currency: string } }[] };
        current_period_end: number;
        metadata?: { user_email?: string };
      };

      const email = sub.metadata?.user_email;
      if (!email) {
        return NextResponse.json({ received: true, skipped: true });
      }

      const user = await getUserByEmail(email);
      if (!user) {
        return NextResponse.json({ received: true, skipped: true });
      }

      const price = sub.items.data[0]?.price;
      await syncSubscriptionFromStripe({
        userId: user.id,
        plan: sub.status === "active" ? "pro" : "free",
        status: sub.status,
        amountCents: price?.unit_amount ?? 0,
        currency: (price?.currency ?? "eur").toUpperCase(),
        renewsAt: new Date(sub.current_period_end * 1000).toISOString(),
        stripeCustomerId: sub.customer,
        stripeSubscriptionId: (event.data.object as { id: string }).id,
      });
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as {
        metadata?: { user_email?: string };
        customer: string;
        id: string;
      };
      const email = sub.metadata?.user_email;
      if (email) {
        const user = await getUserByEmail(email);
        if (user) {
          await syncSubscriptionFromStripe({
            userId: user.id,
            plan: "free",
            status: "canceled",
            amountCents: 0,
            stripeCustomerId: sub.customer,
            stripeSubscriptionId: sub.id,
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhooks/stripe]", err);
    return NextResponse.json({ error: "Webhook failed" }, { status: 400 });
  }
}

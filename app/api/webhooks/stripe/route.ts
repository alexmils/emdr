import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import {
  findUserIdByStripeCustomer,
  mapStripeSubscription,
  markStripeEventProcessed,
  releaseStripeEvent,
  syncSubscriptionFromStripe,
} from "@/lib/stripe-admin";
import { getUserByEmail, getUserById, markOnboardingCompleted } from "@/lib/users";

/** Stripe webhook — sync subscription state when configured. */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const stripe = getStripe();
  if (!secret || !stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  let claimedEventId: string | null = null;

  try {
    const body = await request.text();
    const sig = request.headers.get("stripe-signature");
    if (!sig) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const event = stripe.webhooks.constructEvent(body, sig, secret);
    const isNew = await markStripeEventProcessed(event.id, event.type);
    if (!isNew) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    claimedEventId = event.id;

    const resolveUserId = async (
      meta?: {
        user_id?: string;
        user_email?: string;
      },
      customerId?: string | null
    ) => {
      if (meta?.user_id) {
        const u = await getUserById(meta.user_id);
        if (u) return u.id;
      }
      if (meta?.user_email) {
        const u = await getUserByEmail(meta.user_email);
        if (u) return u.id;
      }
      if (customerId) {
        return findUserIdByStripeCustomer(customerId);
      }
      return null;
    };

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as {
        client_reference_id?: string | null;
        customer?: string | null;
        subscription?: string | null;
        metadata?: { user_id?: string; user_email?: string; plan?: string };
      };
      const userId = await resolveUserId(
        {
          user_id: session.client_reference_id ?? session.metadata?.user_id,
          user_email: session.metadata?.user_email,
        },
        session.customer ?? null
      );
      if (!userId || !session.subscription) {
        // Do not keep the claim — allow Stripe retry once metadata/user exists.
        await releaseStripeEvent(event.id);
        claimedEventId = null;
        return NextResponse.json({ received: true, skipped: true });
      }
      const sub = await stripe.subscriptions.retrieve(session.subscription);
      const mapped = mapStripeSubscription(sub);
      await syncSubscriptionFromStripe({
        userId,
        ...mapped,
        eventCreatedAt: event.created,
      });
      await markOnboardingCompleted(userId);
    }

    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.deleted"
    ) {
      const sub = event.data.object as {
        id: string;
        status: string;
        customer: string;
        items: {
          data: {
            price?: {
              id?: string;
              unit_amount?: number | null;
              currency?: string;
            } | null;
          }[];
        };
        current_period_end?: number;
        trial_end?: number | null;
        metadata?: { user_id?: string; user_email?: string; plan?: string };
      };

      const userId = await resolveUserId(sub.metadata, sub.customer);
      if (!userId) {
        await releaseStripeEvent(event.id);
        claimedEventId = null;
        return NextResponse.json({ received: true, skipped: true });
      }

      if (event.type === "customer.subscription.deleted") {
        await syncSubscriptionFromStripe({
          userId,
          plan: "free",
          status: "canceled",
          amountCents: 0,
          accessTier: "none",
          stripeCustomerId: sub.customer,
          stripeSubscriptionId: sub.id,
          eventCreatedAt: event.created,
        });
      } else {
        const mapped = mapStripeSubscription(sub);
        await syncSubscriptionFromStripe({
          userId,
          ...mapped,
          eventCreatedAt: event.created,
        });
        if (mapped.status === "trialing" || mapped.status === "active") {
          await markOnboardingCompleted(userId);
        }
      }
    }

    if (
      event.type === "invoice.payment_failed" ||
      event.type === "invoice.paid"
    ) {
      const invoice = event.data.object as {
        customer?: string | null;
        subscription?: string | null;
      };
      if (invoice.subscription) {
        const sub = await stripe.subscriptions.retrieve(invoice.subscription);
        const userId = await resolveUserId(
          sub.metadata,
          typeof sub.customer === "string" ? sub.customer : sub.customer?.id
        );
        if (!userId) {
          await releaseStripeEvent(event.id);
          claimedEventId = null;
          return NextResponse.json({ received: true, skipped: true });
        }
        const mapped = mapStripeSubscription(sub);
        await syncSubscriptionFromStripe({
          userId,
          ...mapped,
          eventCreatedAt: event.created,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhooks/stripe]", err);
    if (claimedEventId) {
      try {
        await releaseStripeEvent(claimedEventId);
      } catch (releaseErr) {
        console.error("[webhooks/stripe] release claim", releaseErr);
      }
    }
    return NextResponse.json({ error: "Webhook failed" }, { status: 400 });
  }
}

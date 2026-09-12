import { NextResponse } from "next/server";
import {
  isAuthContext,
  requireAdminAccess,
} from "@/lib/api-auth";
import {
  deleteAdminPushSubscription,
  getVapidPublicKey,
  hasAdminPushSubscription,
  saveAdminPushSubscription,
  type PushSubscriptionJSON,
} from "@/lib/admin-push";

export async function GET() {
  const auth = await requireAdminAccess();
  if (!isAuthContext(auth)) return auth;

  const [publicKey, subscribed] = await Promise.all([
    getVapidPublicKey(),
    hasAdminPushSubscription(auth.user.id),
  ]);

  return NextResponse.json({
    publicKey,
    subscribed,
    supportedHint:
      "Install the admin PWA or allow notifications in this browser to get Help alerts.",
  });
}

export async function POST(request: Request) {
  const auth = await requireAdminAccess();
  if (!isAuthContext(auth)) return auth;

  const body = (await request.json().catch(() => ({}))) as {
    subscription?: PushSubscriptionJSON;
  };
  if (!body.subscription?.endpoint || !body.subscription.keys) {
    return NextResponse.json(
      { error: "Missing push subscription" },
      { status: 400 }
    );
  }

  try {
    await saveAdminPushSubscription({
      userId: auth.user.id,
      subscription: body.subscription,
      userAgent: request.headers.get("user-agent"),
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid push subscription" },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, subscribed: true });
}

export async function DELETE(request: Request) {
  const auth = await requireAdminAccess();
  if (!isAuthContext(auth)) return auth;

  const body = (await request.json().catch(() => ({}))) as {
    endpoint?: string;
  };
  await deleteAdminPushSubscription({
    userId: auth.user.id,
    endpoint: body.endpoint,
  });
  return NextResponse.json({ ok: true, subscribed: false });
}

import { NextResponse } from "next/server";
import {
  requireAdminAccess,
  requirePlatformSettingsAccess,
  isAuthContext,
} from "@/lib/api-auth";
import { listAdminBilling } from "@/lib/stripe-admin";
import {
  getPlatformSettings,
  savePlatformSettings,
  type PlatformStripeConfig,
} from "@/lib/platform-settings";
import { resetStripeClient } from "@/lib/stripe";
import {
  mergeStripeConfigPatch,
  stripeAdminStatus,
  toStripeAdminView,
} from "@/lib/stripe-admin-settings";
import { clientIp, writeAuditEvent } from "@/lib/audit-log";

export async function GET() {
  const auth = await requireAdminAccess();
  if (!isAuthContext(auth)) return auth;

  try {
    const [rows, settings] = await Promise.all([
      listAdminBilling(),
      getPlatformSettings(),
    ]);
    const canEdit = auth.user.role === "platform_admin";
    const status = stripeAdminStatus(settings.stripe);
    return NextResponse.json({
      rows,
      stripeConfigured: status.stripeConfigured,
      catalogReady: status.catalogReady,
      webhookReady: status.webhookReady,
      stripe: toStripeAdminView(settings.stripe, canEdit),
      canEdit,
    });
  } catch (err) {
    console.error("[admin/billing]", err);
    return NextResponse.json({ error: "Failed to load billing" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await requirePlatformSettingsAccess();
  if (!isAuthContext(auth)) return auth;

  try {
    const body = (await request.json()) as { stripe?: Partial<PlatformStripeConfig> };
    if (!body.stripe || typeof body.stripe !== "object") {
      return NextResponse.json({ error: "Missing stripe settings" }, { status: 400 });
    }
    const current = await getPlatformSettings();
    const merged = mergeStripeConfigPatch(current.stripe, body.stripe);
    const next = await savePlatformSettings({
      ...current,
      stripe: merged,
    });
    resetStripeClient();

    await writeAuditEvent({
      actorUserId: auth.user.id,
      action: "settings.stripe_updated",
      detail: {
        hasSecretKey: Boolean(next.stripe.secretKey),
        hasWebhookSecret: Boolean(next.stripe.webhookSecret),
        priceIdWeekly: next.stripe.priceIdWeekly || null,
        priceIdMonthly: next.stripe.priceIdMonthly || null,
        priceIdYearly: next.stripe.priceIdYearly || null,
      },
      ip: clientIp(request),
    });

    const status = stripeAdminStatus(next.stripe);
    return NextResponse.json({
      stripe: toStripeAdminView(next.stripe, true),
      stripeConfigured: status.stripeConfigured,
      catalogReady: status.catalogReady,
      webhookReady: status.webhookReady,
    });
  } catch (err) {
    console.error("[admin/billing PUT]", err);
    return NextResponse.json({ error: "Failed to save Stripe settings" }, { status: 500 });
  }
}

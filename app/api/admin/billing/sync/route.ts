import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  requirePlatformSettingsAccess,
  isAuthContext,
} from "@/lib/api-auth";
import {
  getPlatformSettings,
  savePlatformSettings,
} from "@/lib/platform-settings";
import {
  applyCatalogSyncToStripeConfig,
  pickPlanPricesFromStripeList,
} from "@/lib/stripe-sync";
import { resetStripeClient } from "@/lib/stripe";
import {
  toStripeAdminView,
  stripeAdminStatus,
} from "@/lib/stripe-admin-settings";
import { clientIp, writeAuditEvent } from "@/lib/audit-log";

/**
 * Pull active recurring week/month/year prices from Stripe and write them
 * into Admin → Billing settings.
 *
 * Body (optional):
 * - secretKey: use this key instead of the saved one (for unsaved form drafts)
 * - save: default true — persist into app_settings
 */
export async function POST(request: Request) {
  const auth = await requirePlatformSettingsAccess();
  if (!isAuthContext(auth)) return auth;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      secretKey?: unknown;
      save?: unknown;
    };
    const current = await getPlatformSettings();
    const draftKey =
      typeof body.secretKey === "string" ? body.secretKey.trim() : "";
    const secretKey = draftKey || current.stripe.secretKey.trim();
    if (!secretKey) {
      return NextResponse.json(
        { error: "Enter a Stripe secret key first" },
        { status: 400 }
      );
    }

    const stripe = new Stripe(secretKey, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });

    const collected: Stripe.Price[] = [];
    for await (const price of stripe.prices.list({
      active: true,
      limit: 100,
      expand: ["data.product"],
    })) {
      collected.push(price);
    }

    const sync = pickPlanPricesFromStripeList(collected);
    if (!sync.weekly && !sync.monthly && !sync.yearly) {
      return NextResponse.json(
        {
          error:
            "No active weekly/monthly/yearly recurring prices found in this Stripe account",
          sync,
        },
        { status: 404 }
      );
    }

    const mergedStripe = applyCatalogSyncToStripeConfig(
      {
        ...current.stripe,
        ...(draftKey ? { secretKey: draftKey } : {}),
      },
      sync
    );

    const shouldSave = body.save !== false;
    let stripeConfig = mergedStripe;
    if (shouldSave) {
      const next = await savePlatformSettings({
        ...current,
        stripe: mergedStripe,
      });
      stripeConfig = next.stripe;
      resetStripeClient();
      await writeAuditEvent({
        actorUserId: auth.user.id,
        action: "settings.stripe_synced",
        detail: {
          scanned: sync.scanned,
          weekly: sync.weekly?.priceId ?? null,
          monthly: sync.monthly?.priceId ?? null,
          yearly: sync.yearly?.priceId ?? null,
        },
        ip: clientIp(request),
      });
    }

    const status = stripeAdminStatus(stripeConfig);
    return NextResponse.json({
      ok: true,
      saved: shouldSave,
      sync,
      stripe: toStripeAdminView(stripeConfig, true),
      stripeConfigured: status.stripeConfigured,
      catalogReady: status.catalogReady,
      webhookReady: status.webhookReady,
      summary: [
        sync.weekly
          ? `Weekly ${sync.weekly.displayPrice} (${sync.weekly.priceId})`
          : null,
        sync.monthly
          ? `Monthly ${sync.monthly.displayPrice} (${sync.monthly.priceId})`
          : null,
        sync.yearly
          ? `Yearly ${sync.yearly.displayPrice} (${sync.yearly.priceId})`
          : null,
      ]
        .filter(Boolean)
        .join(" · "),
    });
  } catch (err) {
    console.error("[admin/billing/sync]", err);
    const message =
      err instanceof Error && /Invalid API Key|No such/i.test(err.message)
        ? "Stripe rejected the secret key"
        : "Could not sync from Stripe";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

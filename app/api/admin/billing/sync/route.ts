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
  applyCatalogSyncToCredentials,
  pickPlanPricesFromStripeList,
} from "@/lib/stripe-sync";
import { resetStripeClient } from "@/lib/stripe";
import {
  toStripeAdminView,
  stripeAdminStatus,
} from "@/lib/stripe-admin-settings";
import { activeStripeEnv } from "@/lib/stripe-config";
import { clientIp, writeAuditEvent } from "@/lib/audit-log";

/**
 * Pull active recurring week/month/year prices from Stripe into the
 * currently active env (sandbox if demoMode, else live).
 *
 * Body (optional):
 * - secretKey: draft key for the active env
 * - env: force "sandbox" | "live" (default: active)
 * - save: default true
 */
export async function POST(request: Request) {
  const auth = await requirePlatformSettingsAccess();
  if (!isAuthContext(auth)) return auth;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      secretKey?: unknown;
      save?: unknown;
      env?: unknown;
    };
    const current = await getPlatformSettings();
    const envName =
      body.env === "live" || body.env === "sandbox"
        ? body.env
        : activeStripeEnv(current.stripe);
    const target = current.stripe[envName];
    const draftKey =
      typeof body.secretKey === "string" ? body.secretKey.trim() : "";
    const secretKey = draftKey || target.secretKey.trim();
    if (!secretKey) {
      return NextResponse.json(
        {
          error: `Enter a Stripe secret key for ${envName} first`,
        },
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

    const syncedCreds = applyCatalogSyncToCredentials(
      {
        ...target,
        ...(draftKey ? { secretKey: draftKey } : {}),
      },
      sync
    );

    const mergedStripe = {
      ...current.stripe,
      [envName]: syncedCreds,
    };

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
          env: envName,
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
      env: envName,
      sync,
      stripe: toStripeAdminView(stripeConfig, true),
      stripeConfigured: status.stripeConfigured,
      catalogReady: status.catalogReady,
      webhookReady: status.webhookReady,
      demoMode: status.demoMode,
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

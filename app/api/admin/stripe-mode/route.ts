import { NextResponse } from "next/server";
import { requireAdminAccess, isAuthContext } from "@/lib/api-auth";
import { getPlatformSettings } from "@/lib/platform-settings";
import { activeStripeEnv } from "@/lib/stripe-config";

/** Lightweight Stripe mode for admin shell banner. */
export async function GET() {
  const auth = await requireAdminAccess();
  if (!isAuthContext(auth)) return auth;

  try {
    const settings = await getPlatformSettings();
    const demoMode = settings.stripe.demoMode !== false;
    return NextResponse.json({
      demoMode,
      activeEnv: activeStripeEnv(settings.stripe),
    });
  } catch (err) {
    console.error("[admin/stripe-mode]", err);
    return NextResponse.json({ error: "Failed to load Stripe mode" }, { status: 500 });
  }
}

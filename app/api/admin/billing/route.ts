import { NextResponse } from "next/server";
import { requireAdminAccess, isAuthContext } from "@/lib/api-auth";
import { isStripeConfigured, listAdminBilling } from "@/lib/stripe-admin";

export async function GET() {
  const auth = await requireAdminAccess();
  if (!isAuthContext(auth)) return auth;

  try {
    const rows = await listAdminBilling();
    return NextResponse.json({
      rows,
      stripeConfigured: isStripeConfigured(),
    });
  } catch (err) {
    console.error("[admin/billing]", err);
    return NextResponse.json({ error: "Failed to load billing" }, { status: 500 });
  }
}

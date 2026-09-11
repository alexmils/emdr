import { NextResponse } from "next/server";
import { requireAdminAccess, isAuthContext } from "@/lib/api-auth";
import { getEmailProviderStatus } from "@/lib/email/status";
import { getFromAddress } from "@/lib/email/types";
import { getPlatformSettings, getPublicAppUrl } from "@/lib/platform-settings";
import { emailAdminStatus } from "@/lib/email-admin-settings";

/** Lightweight health for dashboard chips — full settings at /api/admin/email/settings. */
export async function GET() {
  const auth = await requireAdminAccess();
  if (!isAuthContext(auth)) return auth;

  try {
    const settings = await getPlatformSettings();
    const env = await getEmailProviderStatus();
    let fromAddress: string | null = null;
    let fromName: string | null = null;
    try {
      const from = await getFromAddress();
      fromAddress = from.email;
      fromName = from.name;
    } catch {
      /* optional until configured */
    }
    const appUrl = await getPublicAppUrl();
    const detailed = emailAdminStatus(settings.email, {
      fromName: settings.fromName,
      fromAddress: settings.fromAddress,
      appUrl,
      resolvedFromName: fromName,
      resolvedFromAddress: fromAddress,
    });

    return NextResponse.json({
      status: {
        ...env,
        appUrl,
        fromAddress,
        fromName,
        replyTo: detailed.replyTo,
        env: detailed.env,
      },
    });
  } catch (err) {
    console.error("[admin/email/status]", err);
    return NextResponse.json({ error: "Failed to load status" }, { status: 500 });
  }
}

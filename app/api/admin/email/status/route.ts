import { NextResponse } from "next/server";
import { requireAdminAccess, isAuthContext } from "@/lib/api-auth";
import { getEmailProviderEnvStatus } from "@/lib/email/status";
import { getFromAddress } from "@/lib/email/types";
import { getPublicAppUrl } from "@/lib/platform-settings";

export async function GET() {
  const auth = await requireAdminAccess();
  if (!isAuthContext(auth)) return auth;

  try {
    const env = getEmailProviderEnvStatus();
    let fromAddress: string | null = null;
    let fromName: string | null = null;
    try {
      const from = await getFromAddress();
      fromAddress = from.email;
      fromName = from.name;
    } catch {
      /* optional until configured */
    }

    return NextResponse.json({
      status: {
        ...env,
        appUrl: await getPublicAppUrl(),
        fromAddress,
        fromName,
      },
    });
  } catch (err) {
    console.error("[admin/email/status]", err);
    return NextResponse.json({ error: "Failed to load status" }, { status: 500 });
  }
}

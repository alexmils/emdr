import { NextResponse } from "next/server";
import {
  requirePlatformSettingsAccess,
  isAuthContext,
} from "@/lib/api-auth";
import { getPlatformSettings } from "@/lib/platform-settings";
import {
  isSeoTestConnId,
  testSeoConnection,
  type SeoTestConnectionInput,
} from "@/lib/seo-test-connection";

function str(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  return raw;
}

export async function POST(request: Request) {
  const auth = await requirePlatformSettingsAccess();
  if (!isAuthContext(auth)) return auth;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (!isSeoTestConnId(body.type)) {
      return NextResponse.json(
        { ok: false, error: "Unknown connection" },
        { status: 400 }
      );
    }

    const input: SeoTestConnectionInput = {
      type: body.type,
      ga4MeasurementId: str(body.ga4MeasurementId),
      ga4PropertyId: str(body.ga4PropertyId),
      googleServiceAccountJson: str(body.googleServiceAccountJson),
      gscProperty: str(body.gscProperty),
      gscVerification: str(body.gscVerification),
      gtmId: str(body.gtmId),
      clarityId: str(body.clarityId),
      bingVerification: str(body.bingVerification),
      ignoreIps: str(body.ignoreIps),
    };

    const settings = await getPlatformSettings();
    const result = await testSeoConnection(input, settings.seo);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[admin/seo/test-connection]", err);
    return NextResponse.json(
      { ok: false, error: "Connection check failed" },
      { status: 500 }
    );
  }
}

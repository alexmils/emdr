import { NextResponse } from "next/server";
import { requirePlatformSettingsAccess, isAuthContext } from "@/lib/api-auth";
import { getPlatformSettings } from "@/lib/platform-settings";
import {
  envFallbackKey,
  testProviderConnection,
  type CatalogProvider,
} from "@/lib/provider-catalog";

function isCatalogProvider(value: unknown): value is CatalogProvider {
  return (
    value === "deepseek" ||
    value === "openai" ||
    value === "claude" ||
    value === "voice"
  );
}

export async function POST(request: Request) {
  const auth = await requirePlatformSettingsAccess();
  if (!isAuthContext(auth)) return auth;

  try {
    const body = (await request.json()) as {
      provider?: unknown;
      apiKey?: unknown;
    };
    if (!isCatalogProvider(body.provider)) {
      return NextResponse.json(
        { ok: false, error: "Unknown provider" },
        { status: 400 }
      );
    }

    const settings = await getPlatformSettings();
    const fromBody =
      typeof body.apiKey === "string" ? body.apiKey.trim() : "";
    const stored =
      body.provider === "voice"
        ? settings.ai.voice.apiKey
        : settings.ai.connectors[body.provider].apiKey;
    const apiKey = fromBody || stored || envFallbackKey(body.provider);

    const result = await testProviderConnection(body.provider, apiKey);
    return NextResponse.json(result);
  } catch {
    console.error("[admin/ai/test-connection] failed");
    return NextResponse.json(
      { ok: false, error: "Connection check failed" },
      { status: 500 }
    );
  }
}

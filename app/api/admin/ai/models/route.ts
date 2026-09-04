import { NextResponse } from "next/server";
import { requirePlatformSettingsAccess, isAuthContext } from "@/lib/api-auth";
import { getPlatformSettings } from "@/lib/platform-settings";
import {
  envFallbackKey,
  listLlmModels,
  listVoiceCatalog,
  ProviderCatalogError,
  type CatalogProvider,
} from "@/lib/provider-catalog";
import type { AiProvider } from "@/lib/types";

function isCatalogProvider(value: unknown): value is CatalogProvider {
  return (
    value === "deepseek" ||
    value === "openai" ||
    value === "claude" ||
    value === "voice"
  );
}

function storedKey(
  provider: CatalogProvider,
  settings: Awaited<ReturnType<typeof getPlatformSettings>>
): string {
  if (provider === "voice") return settings.ai.voice.apiKey;
  return settings.ai.connectors[provider].apiKey;
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
      return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
    }

    const settings = await getPlatformSettings();
    const fromBody =
      typeof body.apiKey === "string" ? body.apiKey.trim() : "";
    const apiKey =
      fromBody || storedKey(body.provider, settings) || envFallbackKey(body.provider);

    if (!apiKey) {
      return NextResponse.json(
        { error: "No API key for this provider" },
        { status: 400 }
      );
    }

    if (body.provider === "voice") {
      const catalog = await listVoiceCatalog(apiKey);
      return NextResponse.json({
        models: catalog.models,
        voices: catalog.voices,
      });
    }

    const models = await listLlmModels(body.provider as AiProvider, apiKey);
    return NextResponse.json({ models });
  } catch (err) {
    if (err instanceof ProviderCatalogError) {
      console.error("[admin/ai/models]", err.status, err.message);
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    console.error("[admin/ai/models] failed");
    return NextResponse.json({ error: "Failed to list models" }, { status: 500 });
  }
}

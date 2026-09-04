import { NextResponse } from "next/server";
import {
  requirePlatformSettingsAccess,
  isAuthContext,
} from "@/lib/api-auth";
import {
  getPlatformSettings,
  savePlatformSettings,
  type PlatformSettings,
} from "@/lib/platform-settings";
import { clientIp, writeAuditEvent } from "@/lib/audit-log";

export async function GET() {
  const auth = await requirePlatformSettingsAccess();
  if (!isAuthContext(auth)) return auth;

  try {
    const settings = await getPlatformSettings();
    return NextResponse.json({ settings });
  } catch (err) {
    console.error("[admin/platform GET]", err);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await requirePlatformSettingsAccess();
  if (!isAuthContext(auth)) return auth;

  try {
    const body = (await request.json()) as Partial<PlatformSettings>;
    const current = await getPlatformSettings();
    const mergedConnectors = {
      ...current.ai.connectors,
      ...body.ai?.connectors,
      deepseek: {
        ...current.ai.connectors.deepseek,
        ...body.ai?.connectors?.deepseek,
      },
      openai: {
        ...current.ai.connectors.openai,
        ...body.ai?.connectors?.openai,
      },
      claude: {
        ...current.ai.connectors.claude,
        ...body.ai?.connectors?.claude,
      },
    };
    const requestedDefault = body.ai?.defaultProvider;
    if (requestedDefault) {
      const defaultHasKey = Boolean(
        mergedConnectors[requestedDefault]?.apiKey?.trim()
      );
      if (!defaultHasKey) {
        return NextResponse.json(
          {
            error:
              "Default provider must have an API key. Configure the provider first.",
          },
          { status: 400 }
        );
      }
    }

    const next = await savePlatformSettings({
      ...current,
      ...body,
      flags: { ...current.flags, ...body.flags },
      ai: {
        ...current.ai,
        ...body.ai,
        connectors: mergedConnectors,
        voice: {
          ...current.ai.voice,
          ...body.ai?.voice,
        },
      },
    });

    await writeAuditEvent({
      actorUserId: auth.user.id,
      action: "settings.platform_updated",
      detail: {
        siteName: next.siteName,
        invitesEnabled: next.invitesEnabled,
        defaultAiProvider: next.ai.defaultProvider,
      },
      ip: clientIp(request),
    });

    return NextResponse.json({ settings: next });
  } catch (err) {
    console.error("[admin/platform PUT]", err);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}

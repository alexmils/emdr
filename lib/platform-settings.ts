import { ensureSchemaReady, getPool } from "@/lib/db";
import type { AiProvider, ConnectorConfig } from "@/lib/types";
import {
  DEFAULT_AI_CONNECTORS,
  DEFAULT_VOICE_CONNECTOR,
} from "@/lib/types";

export type PlatformFeatureFlags = {
  voice: boolean;
  memory: boolean;
  blsVibration: boolean;
  sessionInterpreter: boolean;
};

export type PlatformAiConnectors = {
  deepseek: ConnectorConfig;
  openai: ConnectorConfig;
  claude: ConnectorConfig;
};

export type PlatformVoiceConfig = ConnectorConfig & { voiceId: string };

export type PlatformAiConfig = {
  defaultProvider: AiProvider;
  connectors: PlatformAiConnectors;
  voice: PlatformVoiceConfig;
};

export type PlatformSettings = {
  siteName: string;
  supportEmail: string;
  publicAppUrl: string;
  invitesEnabled: boolean;
  maintenanceMessage: string;
  fromName: string;
  fromAddress: string;
  /** Extra protocol notes appended to the session guide system prompt. */
  agentKnowledgeNotes: string;
  flags: PlatformFeatureFlags;
  ai: PlatformAiConfig;
};

export const DEFAULT_PLATFORM_AI: PlatformAiConfig = {
  // Prefer OpenAI chat models for guided EMDR; resolveLlmProvider falls back if no key.
  defaultProvider: "openai",
  connectors: {
    deepseek: { ...DEFAULT_AI_CONNECTORS.deepseek },
    openai: { ...DEFAULT_AI_CONNECTORS.openai },
    claude: { ...DEFAULT_AI_CONNECTORS.claude },
  },
  voice: { ...DEFAULT_VOICE_CONNECTOR },
};

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  siteName: "EMDR Guide",
  supportEmail: "",
  publicAppUrl: "",
  invitesEnabled: true,
  maintenanceMessage: "",
  fromName: "",
  fromAddress: "",
  agentKnowledgeNotes: "",
  flags: {
    voice: true,
    memory: true,
    blsVibration: true,
    sessionInterpreter: true,
  },
  ai: { ...DEFAULT_PLATFORM_AI, connectors: { ...DEFAULT_AI_CONNECTORS }, voice: { ...DEFAULT_VOICE_CONNECTOR } },
};

/** Old user AppSettings mistakenly stored in app_settings (has autoVoice, no siteName). */
function isLegacyUserSettings(json: unknown): boolean {
  if (!json || typeof json !== "object") return false;
  const o = json as Record<string, unknown>;
  return "autoVoice" in o && !("siteName" in o);
}

function normalizeConnector(
  raw: Partial<ConnectorConfig> | undefined,
  fallback: ConnectorConfig,
  provider?: AiProvider
): ConnectorConfig {
  let model =
    typeof raw?.model === "string" && raw.model.trim()
      ? raw.model.trim()
      : fallback.model;
  // gpt-5* burns completion tokens on hidden reasoning and rejects temperature —
  // unsuitable for short guided EMDR turns.
  if (provider === "openai" && /^gpt-5/i.test(model)) {
    model = fallback.model;
  }
  return {
    apiKey: typeof raw?.apiKey === "string" ? raw.apiKey : fallback.apiKey,
    model,
    enabled: raw?.enabled !== false,
  };
}

function normalizeAi(raw: unknown): PlatformAiConfig {
  const r =
    raw && typeof raw === "object"
      ? (raw as Partial<PlatformAiConfig> & {
          defaultAiProvider?: AiProvider;
          connectors?: Partial<PlatformAiConnectors> & {
            elevenlabs?: PlatformVoiceConfig;
          };
        })
      : {};

  const provider =
    r.defaultProvider === "openai" ||
    r.defaultProvider === "claude" ||
    r.defaultProvider === "deepseek"
      ? r.defaultProvider
      : r.defaultAiProvider === "openai" ||
          r.defaultAiProvider === "claude" ||
          r.defaultAiProvider === "deepseek"
        ? r.defaultAiProvider
        : DEFAULT_PLATFORM_AI.defaultProvider;

  const voiceRaw = r.voice ?? r.connectors?.elevenlabs;
  const voiceBase = DEFAULT_VOICE_CONNECTOR;

  return {
    defaultProvider: provider,
    connectors: {
      deepseek: normalizeConnector(
        r.connectors?.deepseek,
        DEFAULT_AI_CONNECTORS.deepseek,
        "deepseek"
      ),
      openai: normalizeConnector(
        r.connectors?.openai,
        DEFAULT_AI_CONNECTORS.openai,
        "openai"
      ),
      claude: normalizeConnector(
        r.connectors?.claude,
        DEFAULT_AI_CONNECTORS.claude,
        "claude"
      ),
    },
    voice: {
      ...normalizeConnector(voiceRaw, voiceBase),
      voiceId:
        typeof voiceRaw?.voiceId === "string" && voiceRaw.voiceId.trim()
          ? voiceRaw.voiceId.trim()
          : voiceBase.voiceId,
    },
  };
}

function normalizeSettings(raw: unknown): PlatformSettings {
  if (!raw || typeof raw !== "object" || isLegacyUserSettings(raw)) {
    return {
      ...DEFAULT_PLATFORM_SETTINGS,
      ai: {
        ...DEFAULT_PLATFORM_AI,
        connectors: { ...DEFAULT_AI_CONNECTORS },
        voice: { ...DEFAULT_VOICE_CONNECTOR },
      },
    };
  }
  const r = raw as Partial<PlatformSettings> & {
    defaultAiProvider?: AiProvider;
    connectors?: PlatformAiConnectors & { elevenlabs?: PlatformVoiceConfig };
  };
  return {
    siteName: r.siteName?.trim() || DEFAULT_PLATFORM_SETTINGS.siteName,
    supportEmail: r.supportEmail?.trim() ?? "",
    publicAppUrl: r.publicAppUrl?.trim() ?? "",
    invitesEnabled: r.invitesEnabled !== false,
    maintenanceMessage: r.maintenanceMessage?.trim() ?? "",
    fromName: r.fromName?.trim() ?? "",
    fromAddress: r.fromAddress?.trim() ?? "",
    agentKnowledgeNotes:
      typeof r.agentKnowledgeNotes === "string"
        ? r.agentKnowledgeNotes.slice(0, 4000)
        : "",
    flags: {
      voice: r.flags?.voice !== false,
      memory: r.flags?.memory !== false,
      blsVibration: r.flags?.blsVibration !== false,
      sessionInterpreter: r.flags?.sessionInterpreter !== false,
    },
    ai: normalizeAi(r.ai ?? r),
  };
}

/** Test helper — same as save/load normalization. */
export function normalizeSettingsForTest(raw: unknown): PlatformSettings {
  return normalizeSettings(raw);
}

export async function getPlatformSettings(): Promise<PlatformSettings> {
  await ensureSchemaReady();
  const { rows } = await getPool().query<{ json: unknown }>(
    "SELECT json FROM app_settings WHERE id = 1"
  );
  if (!rows[0]) {
    await savePlatformSettings(DEFAULT_PLATFORM_SETTINGS);
    return {
      ...DEFAULT_PLATFORM_SETTINGS,
      ai: {
        ...DEFAULT_PLATFORM_AI,
        connectors: { ...DEFAULT_AI_CONNECTORS },
        voice: { ...DEFAULT_VOICE_CONNECTOR },
      },
    };
  }
  const settings = normalizeSettings(rows[0].json);
  if (isLegacyUserSettings(rows[0].json)) {
    await savePlatformSettings(settings);
  }
  return settings;
}

export async function savePlatformSettings(
  settings: PlatformSettings
): Promise<PlatformSettings> {
  await ensureSchemaReady();
  const normalized = normalizeSettings(settings);
  await getPool().query(
    `INSERT INTO app_settings (id, json) VALUES (1, $1)
     ON CONFLICT (id) DO UPDATE SET json = EXCLUDED.json`,
    [JSON.stringify(normalized)]
  );
  return normalized;
}

export async function getPublicAppUrl(): Promise<string> {
  const settings = await getPlatformSettings();
  if (settings.publicAppUrl.trim()) {
    return settings.publicAppUrl.replace(/\/$/, "");
  }
  return (process.env.APP_URL ?? "http://localhost:3471").replace(/\/$/, "");
}

/** Runtime shape used by chatCompletion / synthesizeSpeech. */
export type LlmRuntimeConfig = {
  defaultAiProvider: AiProvider;
  connectors: PlatformAiConnectors & {
    elevenlabs: PlatformVoiceConfig;
  };
};

export async function getLlmRuntimeConfig(): Promise<LlmRuntimeConfig> {
  const platform = await getPlatformSettings();
  return {
    defaultAiProvider: platform.ai.defaultProvider,
    connectors: {
      ...platform.ai.connectors,
      elevenlabs: platform.ai.voice,
    },
  };
}

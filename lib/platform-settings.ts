import { ensureSchemaReady, getPool } from "@/lib/db";
import type { AiProvider, ConnectorConfig } from "@/lib/types";
import {
  DEFAULT_AI_CONNECTORS,
  DEFAULT_VOICE_CONNECTOR,
} from "@/lib/types";
import {
  DEFAULT_HELP_SETTINGS,
  normalizeHelpSettings,
  type HelpSettings,
} from "@/lib/help-settings";
import {
  DEFAULT_PLATFORM_ADS,
  normalizeAdsSettings,
  type PlatformAdsSettings,
} from "@/lib/ads";
import { BRAND_SPOKEN, chromeBrandName } from "@/lib/brand";

export type { HelpSettings };
export { DEFAULT_HELP_SETTINGS, normalizeHelpSettings };
export type { PlatformAdsSettings };
export { DEFAULT_PLATFORM_ADS, normalizeAdsSettings };

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

/** Stripe billing — edited in Admin → Billing (not env). */
export type PlatformStripeConfig = {
  secretKey: string;
  webhookSecret: string;
  publishableKey: string;
  priceIdWeekly: string;
  priceIdMonthly: string;
  priceIdYearly: string;
  /** Display labels shown on onboarding / billing (e.g. €4.99). */
  displayPriceWeekly: string;
  displayPriceMonthly: string;
  displayPriceYearly: string;
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
  help: HelpSettings;
  ads: PlatformAdsSettings;
  stripe: PlatformStripeConfig;
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

export const DEFAULT_PLATFORM_STRIPE: PlatformStripeConfig = {
  secretKey: "",
  webhookSecret: "",
  publishableKey: "",
  priceIdWeekly: "",
  priceIdMonthly: "",
  priceIdYearly: "",
  displayPriceWeekly: "€4.99",
  displayPriceMonthly: "€14.99",
  displayPriceYearly: "€99",
};

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  siteName: "Nura",
  supportEmail: "",
  publicAppUrl: "",
  invitesEnabled: true,
  maintenanceMessage: "",
  fromName: "Nura",
  fromAddress: "hi@contact.nurahelp.com",
  agentKnowledgeNotes: "",
  flags: {
    voice: true,
    memory: true,
    blsVibration: true,
    sessionInterpreter: true,
  },
  ai: { ...DEFAULT_PLATFORM_AI, connectors: { ...DEFAULT_AI_CONNECTORS }, voice: { ...DEFAULT_VOICE_CONNECTOR } },
  help: { ...DEFAULT_HELP_SETTINGS },
  ads: { ...DEFAULT_PLATFORM_ADS },
  stripe: { ...DEFAULT_PLATFORM_STRIPE },
};

function normalizeStripe(raw: unknown): PlatformStripeConfig {
  const r =
    raw && typeof raw === "object"
      ? (raw as Partial<PlatformStripeConfig>)
      : {};
  const str = (v: unknown, fallback = "") =>
    typeof v === "string" ? v.trim() : fallback;
  return {
    secretKey: str(r.secretKey),
    webhookSecret: str(r.webhookSecret),
    publishableKey: str(r.publishableKey),
    priceIdWeekly: str(r.priceIdWeekly),
    priceIdMonthly: str(r.priceIdMonthly),
    priceIdYearly: str(r.priceIdYearly),
    displayPriceWeekly:
      str(r.displayPriceWeekly) || DEFAULT_PLATFORM_STRIPE.displayPriceWeekly,
    displayPriceMonthly:
      str(r.displayPriceMonthly) || DEFAULT_PLATFORM_STRIPE.displayPriceMonthly,
    displayPriceYearly:
      str(r.displayPriceYearly) || DEFAULT_PLATFORM_STRIPE.displayPriceYearly,
  };
}

/** One-time bootstrap from legacy STRIPE_* env when DB fields are empty. */
function stripeFromEnvFallback(
  current: PlatformStripeConfig
): PlatformStripeConfig {
  const env = (k: string) => process.env[k]?.trim() || "";
  const pick = (cur: string, envKey: string) => cur || env(envKey);
  return {
    secretKey: pick(current.secretKey, "STRIPE_SECRET_KEY"),
    webhookSecret: pick(current.webhookSecret, "STRIPE_WEBHOOK_SECRET"),
    publishableKey: pick(current.publishableKey, "STRIPE_PUBLISHABLE_KEY"),
    priceIdWeekly: pick(current.priceIdWeekly, "STRIPE_PRICE_ID_WEEKLY"),
    priceIdMonthly:
      pick(current.priceIdMonthly, "STRIPE_PRICE_ID_MONTHLY") ||
      pick("", "STRIPE_PRICE_ID"),
    priceIdYearly: pick(current.priceIdYearly, "STRIPE_PRICE_ID_YEARLY"),
    displayPriceWeekly: current.displayPriceWeekly,
    displayPriceMonthly: current.displayPriceMonthly,
    displayPriceYearly: current.displayPriceYearly,
  };
}

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
      help: { ...DEFAULT_HELP_SETTINGS },
      ads: { ...DEFAULT_PLATFORM_ADS },
      stripe: { ...DEFAULT_PLATFORM_STRIPE },
    };
  }
  const r = raw as Partial<PlatformSettings> & {
    defaultAiProvider?: AiProvider;
    connectors?: PlatformAiConnectors & { elevenlabs?: PlatformVoiceConfig };
  };
  return {
    siteName: chromeBrandName(r.siteName) || BRAND_SPOKEN,
    supportEmail: r.supportEmail?.trim() ?? "",
    publicAppUrl: r.publicAppUrl?.trim() ?? "",
    invitesEnabled: r.invitesEnabled !== false,
    maintenanceMessage: r.maintenanceMessage?.trim() ?? "",
    fromName: chromeBrandName(r.fromName) || BRAND_SPOKEN,
    fromAddress: r.fromAddress?.trim() || DEFAULT_PLATFORM_SETTINGS.fromAddress,
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
    help: normalizeHelpSettings(
      (r as Partial<PlatformSettings>).help ?? DEFAULT_HELP_SETTINGS
    ),
    ads: normalizeAdsSettings(
      (r as Partial<PlatformSettings>).ads ?? DEFAULT_PLATFORM_ADS
    ),
    stripe: normalizeStripe((r as Partial<PlatformSettings>).stripe),
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
    const seeded = {
      ...DEFAULT_PLATFORM_SETTINGS,
      ai: {
        ...DEFAULT_PLATFORM_AI,
        connectors: { ...DEFAULT_AI_CONNECTORS },
        voice: { ...DEFAULT_VOICE_CONNECTOR },
      },
      stripe: stripeFromEnvFallback(DEFAULT_PLATFORM_STRIPE),
    };
    await savePlatformSettings(seeded);
    return normalizeSettings(seeded);
  }
  let settings = normalizeSettings(rows[0].json);
  const raw = rows[0].json as Partial<PlatformSettings> | null;
  const missingSender =
    isLegacyUserSettings(rows[0].json) ||
    !raw ||
    typeof raw !== "object" ||
    !String((raw as PlatformSettings).fromAddress ?? "").trim();
  const stripeEmpty =
    !settings.stripe.secretKey &&
    !settings.stripe.webhookSecret &&
    !settings.stripe.priceIdMonthly;
  const stripeBootstrapped = stripeEmpty
    ? stripeFromEnvFallback(settings.stripe)
    : settings.stripe;
  const needsStripePersist =
    stripeEmpty &&
    Boolean(
      stripeBootstrapped.secretKey ||
        stripeBootstrapped.webhookSecret ||
        stripeBootstrapped.priceIdMonthly
    );
  if (needsStripePersist) {
    settings = { ...settings, stripe: stripeBootstrapped };
  }
  if (missingSender || needsStripePersist) {
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

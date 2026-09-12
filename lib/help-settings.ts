import { rewriteRetiredBrandCopy } from "@/lib/brand";
import type { AiProvider } from "@/lib/types";

const AI_PROVIDERS: AiProvider[] = ["deepseek", "openai", "claude"];

export function isHelpAiProvider(value: unknown): value is AiProvider {
  return (
    typeof value === "string" &&
    (AI_PROVIDERS as string[]).includes(value)
  );
}

export type HelpSettings = {
  enabled: boolean;
  aiFirstReply: boolean;
  /** Empty = platform default provider. */
  aiProvider: AiProvider | "";
  /** Empty = that connector’s model from Admin → AI. */
  aiModel: string;
  welcomeMessage: string;
  allowedTopics: string;
  deniedTopics: string;
  extraSystemNotes: string;
  notifyAdminsByEmail: boolean;
};

export const DEFAULT_HELP_SETTINGS: HelpSettings = {
  enabled: true,
  aiFirstReply: true,
  // Cheapest OpenAI text lane — good for FAQ / product support chat
  // ($0.05 in / $0.40 out per 1M). Guided sessions stay on gpt-4.1-mini.
  aiProvider: "openai",
  aiModel: "gpt-5-nano",
  welcomeMessage:
    "Hi — I’m the Nura assistant. Ask about billing, your account, or how sessions work. For emergencies, contact local emergency services.",
  allowedTopics:
    "Billing and plans\nTrial limits\nAccount and password\nHow guided and free sessions work\nSession controls\nPrivacy and data basics\nTechnical troubleshooting",
  deniedTopics:
    "Medical or clinical diagnosis\nTherapy advice or trauma processing guidance\nCrisis counseling\nLegal advice\nAnything unrelated to the Nura product",
  extraSystemNotes: "",
  notifyAdminsByEmail: true,
};

export function normalizeHelpSettings(raw: unknown): HelpSettings {
  const r =
    raw && typeof raw === "object"
      ? (raw as Partial<HelpSettings>)
      : {};
  return {
    enabled: r.enabled !== false,
    aiFirstReply: r.aiFirstReply !== false,
    aiProvider: isHelpAiProvider(r.aiProvider)
      ? r.aiProvider
      : r.aiProvider === ""
        ? ""
        : DEFAULT_HELP_SETTINGS.aiProvider,
    aiModel:
      typeof r.aiModel === "string"
        ? r.aiModel.trim().slice(0, 200)
        : DEFAULT_HELP_SETTINGS.aiModel,
    welcomeMessage: remapHelpField(
      typeof r.welcomeMessage === "string" && r.welcomeMessage.trim()
        ? r.welcomeMessage.trim()
        : DEFAULT_HELP_SETTINGS.welcomeMessage
    ),
    allowedTopics:
      typeof r.allowedTopics === "string"
        ? remapHelpField(r.allowedTopics)
        : DEFAULT_HELP_SETTINGS.allowedTopics,
    deniedTopics:
      typeof r.deniedTopics === "string"
        ? remapHelpField(r.deniedTopics)
        : DEFAULT_HELP_SETTINGS.deniedTopics,
    extraSystemNotes:
      typeof r.extraSystemNotes === "string"
        ? remapHelpField(r.extraSystemNotes)
        : "",
    notifyAdminsByEmail: r.notifyAdminsByEmail !== false,
  };
}

function remapHelpField(text: string): string {
  return rewriteRetiredBrandCopy(text);
}

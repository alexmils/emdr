export type HelpSettings = {
  enabled: boolean;
  aiFirstReply: boolean;
  welcomeMessage: string;
  allowedTopics: string;
  deniedTopics: string;
  extraSystemNotes: string;
  notifyAdminsByEmail: boolean;
};

export const DEFAULT_HELP_SETTINGS: HelpSettings = {
  enabled: true,
  aiFirstReply: true,
  welcomeMessage:
    "Hi — I’m the NuraHelp assistant. Ask about billing, your account, or how sessions work. For emergencies, contact local emergency services.",
  allowedTopics:
    "Billing and plans\nTrial limits\nAccount and password\nHow guided and free sessions work\nBLS controls\nPrivacy and data basics\nTechnical troubleshooting",
  deniedTopics:
    "Medical or clinical diagnosis\nTherapy advice or trauma processing guidance\nCrisis counseling\nLegal advice\nAnything unrelated to the NuraHelp product",
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
    welcomeMessage:
      typeof r.welcomeMessage === "string" && r.welcomeMessage.trim()
        ? r.welcomeMessage.trim()
        : DEFAULT_HELP_SETTINGS.welcomeMessage,
    allowedTopics:
      typeof r.allowedTopics === "string"
        ? r.allowedTopics
        : DEFAULT_HELP_SETTINGS.allowedTopics,
    deniedTopics:
      typeof r.deniedTopics === "string"
        ? r.deniedTopics
        : DEFAULT_HELP_SETTINGS.deniedTopics,
    extraSystemNotes:
      typeof r.extraSystemNotes === "string" ? r.extraSystemNotes : "",
    notifyAdminsByEmail: r.notifyAdminsByEmail !== false,
  };
}

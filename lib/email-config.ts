/**
 * Email delivery credentials — Admin → Email.
 * Secrets live in `app_settings.email`; env vars remain optional bootstrap / fallback.
 */

export type PlatformEmailConfig = {
  brevoApiKey: string;
  gmailClientId: string;
  gmailClientSecret: string;
  gmailRefreshToken: string;
  /** Optional Reply-To for outbound mail (empty = omit). */
  replyTo: string;
};

export const DEFAULT_PLATFORM_EMAIL: PlatformEmailConfig = {
  brevoApiKey: "",
  gmailClientId: "",
  gmailClientSecret: "",
  gmailRefreshToken: "",
  replyTo: "",
};

export function normalizeEmailConfig(raw: unknown): PlatformEmailConfig {
  const r =
    raw && typeof raw === "object"
      ? (raw as Partial<PlatformEmailConfig>)
      : {};
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  return {
    brevoApiKey: str(r.brevoApiKey),
    gmailClientId: str(r.gmailClientId),
    gmailClientSecret: str(r.gmailClientSecret),
    gmailRefreshToken: str(r.gmailRefreshToken),
    replyTo: str(r.replyTo),
  };
}

export function isEmailConfigEmpty(cfg: PlatformEmailConfig): boolean {
  return (
    !cfg.brevoApiKey &&
    !cfg.gmailClientId &&
    !cfg.gmailClientSecret &&
    !cfg.gmailRefreshToken &&
    !cfg.replyTo
  );
}

/** One-time / gap-fill from .env when DB fields are blank. */
export function emailFromEnvFallback(
  current: PlatformEmailConfig
): PlatformEmailConfig {
  const env = (k: string) => process.env[k]?.trim() || "";
  const pick = (cur: string, envKey: string) => cur || env(envKey);
  return {
    brevoApiKey: pick(current.brevoApiKey, "BREVO_API_KEY"),
    gmailClientId: pick(current.gmailClientId, "GMAIL_CLIENT_ID"),
    gmailClientSecret: pick(current.gmailClientSecret, "GMAIL_CLIENT_SECRET"),
    gmailRefreshToken: pick(current.gmailRefreshToken, "GMAIL_REFRESH_TOKEN"),
    replyTo: current.replyTo,
  };
}

export function isBrevoConfigured(cfg: PlatformEmailConfig): boolean {
  return Boolean(cfg.brevoApiKey.trim() || process.env.BREVO_API_KEY?.trim());
}

export function isGmailCredentialsConfigured(cfg: PlatformEmailConfig): boolean {
  const id = cfg.gmailClientId.trim() || process.env.GMAIL_CLIENT_ID?.trim();
  const secret =
    cfg.gmailClientSecret.trim() || process.env.GMAIL_CLIENT_SECRET?.trim();
  const refresh =
    cfg.gmailRefreshToken.trim() || process.env.GMAIL_REFRESH_TOKEN?.trim();
  return Boolean(id && secret && refresh);
}

export function resolveBrevoApiKey(cfg: PlatformEmailConfig): string | null {
  const key = cfg.brevoApiKey.trim() || process.env.BREVO_API_KEY?.trim();
  return key || null;
}

export function resolveGmailCredentials(cfg: PlatformEmailConfig): {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
} | null {
  const clientId =
    cfg.gmailClientId.trim() || process.env.GMAIL_CLIENT_ID?.trim() || "";
  const clientSecret =
    cfg.gmailClientSecret.trim() ||
    process.env.GMAIL_CLIENT_SECRET?.trim() ||
    "";
  const refreshToken =
    cfg.gmailRefreshToken.trim() ||
    process.env.GMAIL_REFRESH_TOKEN?.trim() ||
    "";
  if (!clientId || !clientSecret || !refreshToken) return null;
  return { clientId, clientSecret, refreshToken };
}

export type EmailCredentialSource = "stored" | "env" | "none";

export function brevoKeySource(cfg: PlatformEmailConfig): EmailCredentialSource {
  if (cfg.brevoApiKey.trim()) return "stored";
  if (process.env.BREVO_API_KEY?.trim()) return "env";
  return "none";
}

export function gmailCredsSource(
  cfg: PlatformEmailConfig
): EmailCredentialSource {
  const stored =
    cfg.gmailClientId.trim() &&
    cfg.gmailClientSecret.trim() &&
    cfg.gmailRefreshToken.trim();
  if (stored) return "stored";
  if (
    process.env.GMAIL_CLIENT_ID?.trim() &&
    process.env.GMAIL_CLIENT_SECRET?.trim() &&
    process.env.GMAIL_REFRESH_TOKEN?.trim()
  ) {
    return "env";
  }
  // Partial stored still counts as stored if any piece is in DB
  if (
    cfg.gmailClientId.trim() ||
    cfg.gmailClientSecret.trim() ||
    cfg.gmailRefreshToken.trim()
  ) {
    return "stored";
  }
  return "none";
}

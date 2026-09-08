import { isGmailConfigured } from "./gmail";

export type EmailProviderStatus = {
  gmailConfigured: boolean;
  brevoConfigured: boolean;
  /** @deprecated alias of gmailConfigured — Gmail is the fallback provider */
  gmailFallbackConfigured: boolean;
  fromAddress: string | null;
  fromName: string | null;
  appUrl: string;
  primaryProvider: "gmail" | "brevo" | "none";
};

export function getEmailProviderEnvStatus(): Pick<
  EmailProviderStatus,
  | "gmailConfigured"
  | "brevoConfigured"
  | "gmailFallbackConfigured"
  | "primaryProvider"
> {
  const gmailConfigured = isGmailConfigured();
  const brevoConfigured = Boolean(process.env.BREVO_API_KEY?.trim());
  return {
    gmailConfigured,
    brevoConfigured,
    gmailFallbackConfigured: gmailConfigured,
    primaryProvider: brevoConfigured
      ? "brevo"
      : gmailConfigured
        ? "gmail"
        : "none",
  };
}

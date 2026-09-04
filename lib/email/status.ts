import { isGmailConfigured } from "./gmail";

export type EmailProviderStatus = {
  brevoConfigured: boolean;
  gmailFallbackConfigured: boolean;
  fromAddress: string | null;
  fromName: string | null;
  appUrl: string;
};

export function getEmailProviderEnvStatus(): Pick<
  EmailProviderStatus,
  "brevoConfigured" | "gmailFallbackConfigured"
> {
  return {
    brevoConfigured: Boolean(process.env.BREVO_API_KEY?.trim()),
    gmailFallbackConfigured: isGmailConfigured(),
  };
}

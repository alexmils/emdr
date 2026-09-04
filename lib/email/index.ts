import { sendViaBrevo } from "./brevo";
import { isGmailConfigured, sendViaGmail } from "./gmail";
import { logEmailEvent } from "@/lib/email-events";
import {
  isQuotaError,
  type SendEmailInput,
  type SendEmailResult,
} from "./types";

export type { SendEmailInput, SendEmailResult } from "./types";
export {
  renderEmailTemplate,
  getAppUrl,
  appUrl,
  type EmailTemplateId,
  type EmailTemplateData,
} from "./templates";

export async function sendEmail(
  input: SendEmailInput
): Promise<SendEmailResult> {
  const brevoKey = process.env.BREVO_API_KEY;

  try {
    let result: SendEmailResult;
    if (brevoKey) {
      try {
        result = await sendViaBrevo(input);
      } catch (err) {
        if (isQuotaError(err) && isGmailConfigured()) {
          console.warn("[email] Brevo quota hit, falling back to Gmail API");
          result = await sendViaGmail(input);
        } else if (isQuotaError(err)) {
          throw new Error(
            "Brevo quota exceeded and Gmail API fallback is not configured"
          );
        } else {
          throw err;
        }
      }
    } else if (isGmailConfigured()) {
      result = await sendViaGmail(input);
    } else {
      throw new Error(
        "No email provider configured. Set BREVO_API_KEY or Gmail API credentials."
      );
    }

    await logEmailEvent({
      toEmail: input.to,
      templateId: input.templateId ?? null,
      provider: result.provider,
      status: "sent",
    });
    return result;
  } catch (err) {
    await logEmailEvent({
      toEmail: input.to,
      templateId: input.templateId ?? null,
      provider: brevoKey ? "brevo" : isGmailConfigured() ? "gmail" : null,
      status: "failed",
      error: err instanceof Error ? err.message : "Send failed",
    });
    throw err;
  }
}

export async function sendTemplateEmail<
  T extends import("./templates").EmailTemplateId,
>(
  to: string,
  templateId: T,
  data: import("./templates").EmailTemplateData[T]
): Promise<SendEmailResult> {
  const { renderStoredTemplate } = await import("@/lib/email-templates-db");
  const { subject, html, text } = await renderStoredTemplate(templateId, data);
  return sendEmail({ to, subject, html, text, templateId });
}

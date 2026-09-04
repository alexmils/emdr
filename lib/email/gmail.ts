import { google } from "googleapis";
import {
  EmailQuotaError,
  getFromAddress,
  type SendEmailInput,
  type SendEmailResult,
} from "./types";

async function buildRawMessage(input: SendEmailInput): Promise<string> {
  const from = await getFromAddress();
  const sender = process.env.GMAIL_SENDER ?? from.email;
  const boundary = `emdr_${Date.now()}`;

  const lines = [
    `From: ${from.name} <${sender}>`,
    `To: ${input.to}`,
    `Subject: =?UTF-8?B?${Buffer.from(input.subject).toString("base64")}?=`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(input.text).toString("base64"),
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(input.html).toString("base64"),
    `--${boundary}--`,
  ];

  return lines.join("\r\n");
}

export function isGmailConfigured(): boolean {
  return Boolean(
    process.env.GMAIL_CLIENT_ID &&
      process.env.GMAIL_CLIENT_SECRET &&
      process.env.GMAIL_REFRESH_TOKEN
  );
}

export async function sendViaGmail(
  input: SendEmailInput
): Promise<SendEmailResult> {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Gmail API not configured (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN)"
    );
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });

  const gmail = google.gmail({ version: "v1", auth: oauth2 });
  const raw = await buildRawMessage(input);

  try {
    const res = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: Buffer.from(raw)
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, ""),
      },
    });

    return { provider: "gmail", messageId: res.data.id ?? undefined };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("quota") || msg.includes("Rate Limit")) {
      throw new EmailQuotaError(`Gmail quota exceeded: ${msg}`);
    }
    throw err;
  }
}

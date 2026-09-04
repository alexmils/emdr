import { ensureSchemaReady, getPool } from "@/lib/db";
import type { EmailTemplateId } from "@/lib/email/templates";
import { renderEmailTemplate } from "@/lib/email/templates";
import { getPlatformSettings } from "@/lib/platform-settings";

export type EmailTemplateRecord = {
  id: EmailTemplateId;
  subject: string;
  html: string;
  text: string;
  updatedAt: string;
  isCustom: boolean;
};

const ALL_TEMPLATE_IDS: EmailTemplateId[] = [
  "password_reset",
  "welcome_invite",
  "password_changed",
  "welcome",
];

export async function ensureEmailTemplatesSchema() {
  await ensureSchemaReady();
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS email_templates (
      id TEXT PRIMARY KEY,
      subject TEXT NOT NULL,
      html TEXT NOT NULL,
      text TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );
  `);
}

function sampleData(id: EmailTemplateId) {
  const base = {
    name: "Alex",
    resetUrl: "https://example.com/reset",
    createPasswordUrl: "https://example.com/create-password",
    loginUrl: "https://example.com/login",
    expiresIn: "72 hours",
  };
  switch (id) {
    case "password_reset":
      return {
        name: base.name,
        resetUrl: base.resetUrl,
        expiresIn: base.expiresIn,
      };
    case "welcome_invite":
      return {
        name: base.name,
        createPasswordUrl: base.createPasswordUrl,
        expiresIn: base.expiresIn,
      };
    case "password_changed":
      return { name: base.name, loginUrl: base.loginUrl };
    case "welcome":
      return { name: base.name, loginUrl: base.loginUrl };
  }
}

export async function getEmailTemplate(
  id: EmailTemplateId
): Promise<EmailTemplateRecord> {
  await ensureEmailTemplatesSchema();
  const { rows } = await getPool().query<{
    id: string;
    subject: string;
    html: string;
    text: string;
    updated_at: string;
  }>("SELECT * FROM email_templates WHERE id = $1", [id]);

  if (rows[0]) {
    return {
      id,
      subject: rows[0].subject,
      html: rows[0].html,
      text: rows[0].text,
      updatedAt: new Date(rows[0].updated_at).toISOString(),
      isCustom: true,
    };
  }

  const platform = await getPlatformSettings();
  const rendered = renderEmailTemplate(id, sampleData(id) as never, platform.siteName);
  return {
    id,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    updatedAt: new Date().toISOString(),
    isCustom: false,
  };
}

export async function listEmailTemplates(): Promise<EmailTemplateRecord[]> {
  return Promise.all(ALL_TEMPLATE_IDS.map((id) => getEmailTemplate(id)));
}

export async function saveEmailTemplate(
  id: EmailTemplateId,
  patch: { subject: string; html: string; text: string }
): Promise<EmailTemplateRecord> {
  await ensureEmailTemplatesSchema();
  await getPool().query(
    `INSERT INTO email_templates (id, subject, html, text, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (id) DO UPDATE SET
       subject = EXCLUDED.subject,
       html = EXCLUDED.html,
       text = EXCLUDED.text,
       updated_at = NOW()`,
    [id, patch.subject.trim(), patch.html, patch.text]
  );
  return getEmailTemplate(id);
}

export async function renderStoredTemplate<T extends EmailTemplateId>(
  id: T,
  data: import("@/lib/email/templates").EmailTemplateData[T]
): Promise<{ subject: string; html: string; text: string }> {
  const stored = await getEmailTemplate(id);
  if (stored.isCustom) {
    return {
      subject: interpolate(stored.subject, data),
      html: interpolate(stored.html, data),
      text: interpolate(stored.text, data),
    };
  }
  const platform = await getPlatformSettings();
  return renderEmailTemplate(id, data, platform.siteName);
}

function interpolate(template: string, data: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => data[key] ?? "");
}

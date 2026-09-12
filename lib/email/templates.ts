import { BRAND_COLORS } from "@/lib/brand";

export type EmailTemplateId =
  | "password_reset"
  | "welcome_invite"
  | "password_changed"
  | "welcome"
  | "account_deleted";

export type EmailTemplateData = {
  password_reset: {
    name: string;
    resetUrl: string;
    expiresIn: string;
  };
  welcome_invite: {
    name: string;
    createPasswordUrl: string;
    expiresIn: string;
  };
  password_changed: {
    name: string;
    loginUrl: string;
  };
  welcome: {
    name: string;
    loginUrl: string;
  };
  account_deleted: {
    name: string;
    supportEmail: string;
    homeUrl: string;
  };
};

const brandColor = BRAND_COLORS.earth;
const mutedColor = BRAND_COLORS.olive;
const inkColor = BRAND_COLORS.ink;
const pageBg = "#EDF9ED";
const cardBg = "#F7FDF7";
const borderColor = "#B8D4A8";

function layout(
  siteName: string,
  title: string,
  body: string,
  footer = "If you didn't request this email, you can safely ignore it."
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${pageBg};font-family:'Source Sans 3','Segoe UI',system-ui,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${pageBg};padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;background:${cardBg};border-radius:8px;border:1px solid ${borderColor};overflow:hidden;">
          <tr>
            <td style="padding:32px 28px 8px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:500;color:${mutedColor};">${siteName}</p>
              <h1 style="margin:0 0 20px;font-size:22px;font-weight:500;color:${inkColor};letter-spacing:-0.018em;font-family:Georgia,serif;">${title}</h1>
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 28px;border-top:1px solid ${borderColor};">
              <p style="margin:0;font-size:12px;line-height:1.5;color:${mutedColor};">
                ${footer}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(href: string, label: string): string {
  return `<p style="margin:24px 0;">
  <a href="${href}" style="display:inline-block;background:${brandColor};color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 20px;border-radius:8px;">${label}</a>
</p>`;
}

export function renderEmailTemplate<T extends EmailTemplateId>(
  id: T,
  data: EmailTemplateData[T],
  siteName = "Nura"
): { subject: string; html: string; text: string } {
  switch (id) {
    case "password_reset": {
      const d = data as EmailTemplateData["password_reset"];
      const subject = "Reset your password";
      const text = `Hi ${d.name},\n\nReset your password: ${d.resetUrl}\n\nThis link expires in ${d.expiresIn}.`;
      const html = layout(
        siteName,
        "Reset your password",
        `<p style="margin:0 0 12px;font-size:15px;line-height:1.5;color:${inkColor};">Hi ${d.name},</p>
         <p style="margin:0 0 12px;font-size:15px;line-height:1.5;color:${inkColor};">We received a request to reset your password. Use the button below to choose a new one.</p>
         ${ctaButton(d.resetUrl, "Reset password")}
         <p style="margin:0;font-size:13px;line-height:1.5;color:${mutedColor};">This link expires in ${d.expiresIn}.</p>`
      );
      return { subject, html, text };
    }
    case "welcome_invite": {
      const d = data as EmailTemplateData["welcome_invite"];
      const subject = `You're invited to ${siteName}`;
      const text = `Hi ${d.name},\n\nCreate your password: ${d.createPasswordUrl}\n\nThis link expires in ${d.expiresIn}.`;
      const html = layout(
        siteName,
        "Create your password",
        `<p style="margin:0 0 12px;font-size:15px;line-height:1.5;color:${inkColor};">Hi ${d.name},</p>
         <p style="margin:0 0 12px;font-size:15px;line-height:1.5;color:${inkColor};">You've been invited to ${siteName}. Set your password to get started.</p>
         ${ctaButton(d.createPasswordUrl, "Create password")}
         <p style="margin:0;font-size:13px;line-height:1.5;color:${mutedColor};">This link expires in ${d.expiresIn}.</p>`
      );
      return { subject, html, text };
    }
    case "password_changed": {
      const d = data as EmailTemplateData["password_changed"];
      const subject = "Your password was changed";
      const text = `Hi ${d.name},\n\nYour password was changed. Sign in: ${d.loginUrl}`;
      const html = layout(
        siteName,
        "Password updated",
        `<p style="margin:0 0 12px;font-size:15px;line-height:1.5;color:${inkColor};">Hi ${d.name},</p>
         <p style="margin:0 0 12px;font-size:15px;line-height:1.5;color:${inkColor};">Your password was successfully changed. If you didn't make this change, contact support immediately.</p>
         ${ctaButton(d.loginUrl, "Sign in")}`
      );
      return { subject, html, text };
    }
    case "welcome": {
      const d = data as EmailTemplateData["welcome"];
      const subject = `Welcome to ${siteName}`;
      const text = `Hi ${d.name},\n\nYour account is ready. Sign in: ${d.loginUrl}`;
      const html = layout(
        siteName,
        "Welcome",
        `<p style="margin:0 0 12px;font-size:15px;line-height:1.5;color:${inkColor};">Hi ${d.name},</p>
         <p style="margin:0 0 12px;font-size:15px;line-height:1.5;color:${inkColor};">Your account is ready. Sign in to start EMDR Support sessions.</p>
         ${ctaButton(d.loginUrl, "Sign in")}`
      );
      return { subject, html, text };
    }
    case "account_deleted": {
      const d = data as EmailTemplateData["account_deleted"];
      const subject = "Your account was deleted";
      const text = `Hi ${d.name},\n\nYour ${siteName} account and associated session data have been deleted. If you had an active subscription, it was canceled.\n\nIf you did not request this, contact ${d.supportEmail} right away.\n\n${d.homeUrl}`;
      const html = layout(
        siteName,
        "Account deleted",
        `<p style="margin:0 0 12px;font-size:15px;line-height:1.5;color:${inkColor};">Hi ${d.name},</p>
         <p style="margin:0 0 12px;font-size:15px;line-height:1.5;color:${inkColor};">Your ${siteName} account and associated session data have been permanently deleted. If you had an active subscription, it was canceled.</p>
         <p style="margin:0 0 12px;font-size:15px;line-height:1.5;color:${inkColor};">Questions? Email <a href="mailto:${d.supportEmail}" style="color:${brandColor};">${d.supportEmail}</a>.</p>
         ${ctaButton(d.homeUrl, "Back to home")}`,
        `If you did not delete this account, contact ${d.supportEmail} right away.`
      );
      return { subject, html, text };
    }
    default:
      throw new Error(`Unknown email template: ${id}`);
  }
}

export async function getAppUrl(path = ""): Promise<string> {
  const { getPublicAppUrl } = await import("@/lib/platform-settings");
  const base = await getPublicAppUrl();
  return `${base}${path}`;
}

/** @deprecated use getAppUrl */
export function appUrl(path = ""): string {
  const base = process.env.APP_URL ?? "http://localhost:3471";
  return `${base.replace(/\/$/, "")}${path}`;
}

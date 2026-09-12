export type EmailTemplateId =
  | "password_reset"
  | "welcome_invite"
  | "password_changed"
  | "welcome"
  | "account_deleted";

/** Admin-facing names — never show snake_case ids in UI. */
export const EMAIL_TEMPLATE_LABELS: Record<EmailTemplateId, string> = {
  password_reset: "Reset password",
  welcome_invite: "Invite",
  password_changed: "Password changed",
  welcome: "Welcome",
  account_deleted: "Account deleted",
};

export function emailTemplateLabel(id: string): string {
  return EMAIL_TEMPLATE_LABELS[id as EmailTemplateId] ?? id;
}

/** Keep the current pick unless it disappeared from the fetched list. */
export function keepEmailTemplateId(
  selected: string,
  ids: readonly string[]
): string {
  return ids.includes(selected) ? selected : (ids[0] ?? selected);
}

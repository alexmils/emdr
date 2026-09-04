import type { AuditAction } from "@/lib/audit-log";

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(iso: string | null) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatMoney(cents: number, currency = "EUR") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

const ACTION_LABELS: Record<AuditAction, string> = {
  "user.login": "Signed in",
  "user.logout": "Signed out",
  "user.invited": "Invited",
  "user.created": "Created",
  "user.updated": "Updated",
  "user.deleted": "Deleted",
  "user.password_set": "Password set",
  "user.disabled": "Disabled",
  "user.enabled": "Enabled",
  "settings.platform_updated": "Platform settings updated",
  "email.test_sent": "Test email sent",
  "email.broadcast_sent": "Broadcast sent",
};

export function actionLabel(action: AuditAction | string) {
  return ACTION_LABELS[action as AuditAction] ?? action;
}

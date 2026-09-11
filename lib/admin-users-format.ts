/** Client-safe user directory helpers. */

export type UserDirectoryStatus = "active" | "pending" | "disabled";

export function userInitials(name: string | null | undefined, email: string): string {
  const n = name?.trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  }
  const local = email.split("@")[0] ?? "";
  return local.slice(0, 2).toUpperCase() || "?";
}

export function userRoleLabel(role: string): string {
  if (role === "platform_admin") return "Admin";
  if (role === "support") return "Support";
  return "User";
}

export function userPlanLabel(plan: string): string {
  if (plan === "weekly") return "Weekly";
  if (plan === "monthly") return "Monthly";
  if (plan === "yearly") return "Yearly";
  if (plan === "legacy") return "Legacy";
  if (plan === "free" || plan === "none") return "Free";
  return plan || "Free";
}

export function userPlanChip(plan: string): string {
  if (plan === "weekly") return "W";
  if (plan === "monthly") return "M";
  if (plan === "yearly") return "Y";
  if (plan === "legacy") return "L";
  return "F";
}

export function userDirectoryStatus(input: {
  status: string;
  hasPassword: boolean;
  hasGoogle: boolean;
}): UserDirectoryStatus {
  if (input.status === "disabled") return "disabled";
  if (!input.hasPassword && !input.hasGoogle) return "pending";
  return "active";
}

export function userStatusLabel(kind: UserDirectoryStatus): string {
  if (kind === "disabled") return "Disabled";
  if (kind === "pending") return "Pending invite";
  return "Active";
}

export function formatJoinedAt(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function avatarTone(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i) * (i + 1)) % 5;
  return hash;
}

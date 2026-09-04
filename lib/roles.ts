export type UserRole = "platform_admin" | "support" | "user";

export const USER_ROLES: UserRole[] = ["platform_admin", "support", "user"];

export function isValidUserRole(value: unknown): value is UserRole {
  return value === "platform_admin" || value === "support" || value === "user";
}

export function isPlatformAdmin(role: UserRole): boolean {
  return role === "platform_admin";
}

export function isSupportRole(role: UserRole): boolean {
  return role === "support";
}

export function isAdminRole(role: UserRole): boolean {
  return role === "platform_admin" || role === "support";
}

export function canInviteUsers(role: UserRole): boolean {
  return role === "platform_admin";
}

export function canManagePlatformSettings(role: UserRole): boolean {
  return role === "platform_admin";
}

export function canWriteAdminUsers(role: UserRole): boolean {
  return role === "platform_admin";
}

export function canViewAdmin(role: UserRole): boolean {
  return isAdminRole(role);
}

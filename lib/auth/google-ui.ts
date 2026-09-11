import { APP_BASE, LOGIN_PATH } from "@/lib/app-base";

export type GoogleOAuthReturnTo = "login" | "create-account";

export function parseGoogleReturnTo(
  value: string | null | undefined
): GoogleOAuthReturnTo {
  return value === "create-account" ? "create-account" : "login";
}

export function googleAuthErrorPath(
  returnTo: GoogleOAuthReturnTo,
  code: string
): string {
  const base =
    returnTo === "create-account"
      ? `${APP_BASE}/create-account`
      : LOGIN_PATH;
  return `${base}?error=${encodeURIComponent(code)}`;
}

export function googleAuthErrorMessage(code: string | null): string | null {
  if (!code) return null;
  switch (code) {
    case "google_not_configured":
      return "Google sign-in is not configured yet.";
    case "google_cancelled":
      return "Google sign-in was cancelled. Try again.";
    case "google_disabled":
      return "This account has been disabled.";
    case "google_unverified":
      return "Your Google email is not verified. Verify it with Google, then try again.";
    case "google_link_required":
      return "An account with this email already exists. Sign in with your password first.";
    case "google_conflict":
      return "This Google account is already linked to another Nura user.";
    case "google":
    default:
      if (code.startsWith("google")) {
        return "Google sign-in was cancelled or failed. Try again.";
      }
      return null;
  }
}

/**
 * Auto-link Google when the mailbox is proven or the account has no password yet.
 * Block password accounts that never verified email (avoid takeover of guessed signups).
 */
export function canAutoLinkGoogleAccount(user: {
  passwordHash: string | null;
  emailVerified: boolean;
  googleSub?: string | null;
}): boolean {
  if (user.googleSub) return true;
  if (!user.passwordHash) return true;
  return user.emailVerified;
}

export function isPgUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "23505"
  );
}

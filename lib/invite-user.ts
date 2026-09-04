import { createAuthToken } from "@/lib/auth/tokens";
import { deleteAdminUser } from "@/lib/admin-users";
import { createUser, getUserByEmail, type User } from "@/lib/users";
import { getAppUrl, sendTemplateEmail } from "@/lib/email";
import { getPlatformSettings } from "@/lib/platform-settings";

export type InviteUserResult =
  | { ok: true; user: User }
  | { ok: false; error: string; status: number };

export async function inviteUserByEmail(
  email: string,
  name: string | undefined,
  actorId: string | null,
  options?: { rollbackOnEmailFailure?: boolean }
): Promise<InviteUserResult> {
  const platform = await getPlatformSettings();
  if (!platform.invitesEnabled) {
    return {
      ok: false,
      error: "User invitations are currently disabled",
      status: 403,
    };
  }

  const trimmed = email.trim();
  if (!trimmed) {
    return { ok: false, error: "Email is required", status: 400 };
  }

  const existing = await getUserByEmail(trimmed);
  if (existing) {
    return {
      ok: false,
      error: "User with this email already exists",
      status: 409,
    };
  }

  const user = await createUser(trimmed, name, "user");
  const raw = await createAuthToken(user.id, "invite");
  const createPasswordUrl = `${await getAppUrl(
    `/create-password?token=${encodeURIComponent(raw)}`
  )}`;

  try {
    await sendTemplateEmail(user.email, "welcome_invite", {
      name: user.name ?? user.email.split("@")[0],
      createPasswordUrl,
      expiresIn: "72 hours",
    });
  } catch (err) {
    console.error("[invite-user] email failed:", err);
    if (options?.rollbackOnEmailFailure && actorId) {
      await deleteAdminUser(user.id, actorId);
    }
    return {
      ok: false,
      error: "Invitation email failed to send",
      status: 503,
    };
  }

  return { ok: true, user };
}

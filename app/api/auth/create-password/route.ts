import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { consumeAuthToken } from "@/lib/auth/tokens";
import {
  hashPassword,
  validatePassword,
} from "@/lib/auth/password";
import {
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { getUserById, publicUser, setUserPassword } from "@/lib/users";
import { getAppUrl, sendTemplateEmail } from "@/lib/email";
import { clientIp, recordUserLogin, writeAuditEvent } from "@/lib/audit-log";

export async function POST(request: Request) {
  try {
    const { token, password } = (await request.json()) as {
      token?: string;
      password?: string;
    };

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    const pwError = validatePassword(password);
    if (pwError) {
      return NextResponse.json({ error: pwError }, { status: 400 });
    }

    const consumed = await consumeAuthToken(token, "invite");
    if (!consumed) {
      return NextResponse.json(
        { error: "Invalid or expired invitation link" },
        { status: 400 }
      );
    }

    const user = await getUserById(consumed.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.passwordHash) {
      return NextResponse.json(
        { error: "Password already set. Sign in or reset your password." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    await setUserPassword(user.id, passwordHash);

    await writeAuditEvent({
      actorUserId: user.id,
      targetUserId: user.id,
      action: "user.password_set",
      detail: { email: user.email },
      ip: clientIp(request),
    });

    try {
      await sendTemplateEmail(user.email, "welcome", {
        name: user.name ?? user.email.split("@")[0],
        loginUrl: await getAppUrl("/login"),
      });
    } catch (err) {
      console.warn("[auth/create-password] welcome email failed:", err);
    }

    const sessionToken = await createSessionToken({
      sub: user.id,
      email: user.email,
      name: user.name ?? undefined,
      role: user.role,
    });
    const jar = await cookies();
    jar.set(sessionCookieOptions(sessionToken));

    await recordUserLogin(user.id, clientIp(request));

    return NextResponse.json({ user: publicUser({ ...user, passwordHash }) });
  } catch (err) {
    console.error("[auth/create-password]", err);
    return NextResponse.json({ error: "Setup failed" }, { status: 500 });
  }
}

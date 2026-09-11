import { NextResponse } from "next/server";
import { createAuthToken } from "@/lib/auth/tokens";
import { getUserByEmail } from "@/lib/users";
import { getAppUrl, sendTemplateEmail } from "@/lib/email";
import { clientIp } from "@/lib/audit-log";
import {
  extractTurnstileToken,
  verifyTurnstileToken,
} from "@/lib/turnstile";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      "cf-turnstile-response"?: string;
    };

    const gate = await verifyTurnstileToken({
      token: extractTurnstileToken(body),
      expectedAction: "forgot-password",
      remoteip: clientIp(request),
    });
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const { email } = body;

    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await getUserByEmail(email);

    // Always return success to avoid email enumeration
    if (user) {
      const raw = await createAuthToken(user.id, "reset");
      const resetUrl = `${await getAppUrl(
        `/app/reset-password?token=${encodeURIComponent(raw)}`
      )}`;

      try {
        await sendTemplateEmail(user.email, "password_reset", {
          name: user.name ?? user.email.split("@")[0],
          resetUrl,
          expiresIn: "1 hour",
        });
      } catch (err) {
        console.error("[auth/forgot-password] email failed:", err);
        return NextResponse.json(
          { error: "Could not send reset email. Try again later." },
          { status: 503 }
        );
      }
    }

    return NextResponse.json({
      message:
        "If an account exists for that email, we sent a password reset link.",
    });
  } catch (err) {
    console.error("[auth/forgot-password]", err);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}

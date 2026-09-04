import { NextResponse } from "next/server";
import { createAuthenticationOptions } from "@/lib/auth/webauthn";
import { getUserByEmail } from "@/lib/users";
import { listPasskeysForUser } from "@/lib/passkeys";

export async function POST(request: Request) {
  try {
    let email: string | undefined;
    try {
      const body = (await request.json()) as { email?: string };
      email = body.email?.trim();
    } catch {
      /* empty body ok for discoverable passkeys */
    }

    let allowCredentialIds: string[] | undefined;
    if (email) {
      const user = await getUserByEmail(email);
      if (user && user.status !== "disabled") {
        const keys = await listPasskeysForUser(user.id);
        allowCredentialIds = keys.map((k) => k.credentialId);
      } else {
        // Avoid account enumeration — still return a challenge
        allowCredentialIds = [];
      }
    }

    const options = await createAuthenticationOptions({
      allowCredentialIds:
        allowCredentialIds && allowCredentialIds.length > 0
          ? allowCredentialIds
          : undefined,
    });

    return NextResponse.json({ options });
  } catch (err) {
    console.error("[passkey/login/options]", err);
    return NextResponse.json(
      { error: "Could not start passkey login" },
      { status: 500 }
    );
  }
}

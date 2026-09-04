import { NextResponse } from "next/server";
import { requireAuth, isAuthContext } from "@/lib/api-auth";
import { createRegistrationOptions } from "@/lib/auth/webauthn";
import { listPasskeysForUser } from "@/lib/passkeys";

export async function POST() {
  try {
    const auth = await requireAuth();
    if (!isAuthContext(auth)) return auth;

    const existing = await listPasskeysForUser(auth.user.id);
    const options = await createRegistrationOptions({
      userId: auth.user.id,
      email: auth.user.email,
      name: auth.user.name,
      excludeCredentialIds: existing.map((p) => p.credentialId),
    });

    return NextResponse.json({ options });
  } catch (err) {
    console.error("[passkey/register/options]", err);
    return NextResponse.json(
      { error: "Could not start passkey registration" },
      { status: 500 }
    );
  }
}

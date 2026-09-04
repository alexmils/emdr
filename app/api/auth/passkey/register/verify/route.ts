import { NextResponse } from "next/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { requireAuth, isAuthContext } from "@/lib/api-auth";
import {
  publicKeyToBase64Url,
  verifyRegistration,
} from "@/lib/auth/webauthn";
import {
  publicPasskey,
  savePasskey,
  type PasskeyTransport,
} from "@/lib/passkeys";

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (!isAuthContext(auth)) return auth;

    const body = (await request.json()) as {
      response?: RegistrationResponseJSON;
      friendlyName?: string;
    };

    if (!body.response) {
      return NextResponse.json(
        { error: "Registration response is required" },
        { status: 400 }
      );
    }

    const info = await verifyRegistration({
      userId: auth.user.id,
      response: body.response,
    });

    const transports = (info.credential.transports ?? []).filter(
      (t): t is PasskeyTransport =>
        [
          "ble",
          "cable",
          "hybrid",
          "internal",
          "nfc",
          "smart-card",
          "usb",
        ].includes(t)
    );

    const passkey = await savePasskey({
      userId: auth.user.id,
      credentialId: info.credential.id,
      publicKey: publicKeyToBase64Url(info.credential.publicKey),
      counter: info.credential.counter,
      transports,
      deviceType: info.credentialDeviceType,
      backedUp: info.credentialBackedUp,
      friendlyName: body.friendlyName,
    });

    return NextResponse.json({ passkey: publicPasskey(passkey) });
  } catch (err) {
    console.error("[passkey/register/verify]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Passkey registration failed",
      },
      { status: 400 }
    );
  }
}

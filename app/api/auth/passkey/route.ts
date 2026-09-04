import { NextResponse } from "next/server";
import { requireAuth, isAuthContext } from "@/lib/api-auth";
import {
  deletePasskey,
  listPasskeysForUser,
  publicPasskey,
  renamePasskey,
} from "@/lib/passkeys";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (!isAuthContext(auth)) return auth;

    const passkeys = await listPasskeysForUser(auth.user.id);
    return NextResponse.json({
      passkeys: passkeys.map(publicPasskey),
    });
  } catch (err) {
    console.error("[passkey list]", err);
    return NextResponse.json({ error: "Failed to list passkeys" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAuth();
    if (!isAuthContext(auth)) return auth;

    const body = (await request.json()) as {
      id?: string;
      friendlyName?: string;
    };
    if (!body.id || typeof body.friendlyName !== "string") {
      return NextResponse.json({ error: "id and friendlyName required" }, { status: 400 });
    }

    await renamePasskey(body.id, auth.user.id, body.friendlyName);
    const passkeys = await listPasskeysForUser(auth.user.id);
    return NextResponse.json({ passkeys: passkeys.map(publicPasskey) });
  } catch (err) {
    console.error("[passkey rename]", err);
    return NextResponse.json({ error: "Failed to rename passkey" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAuth();
    if (!isAuthContext(auth)) return auth;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await deletePasskey(id, auth.user.id);
    const passkeys = await listPasskeysForUser(auth.user.id);
    return NextResponse.json({ passkeys: passkeys.map(publicPasskey) });
  } catch (err) {
    console.error("[passkey delete]", err);
    return NextResponse.json({ error: "Failed to delete passkey" }, { status: 500 });
  }
}

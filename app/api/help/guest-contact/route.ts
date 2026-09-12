import { NextResponse } from "next/server";
import { clientIp } from "@/lib/audit-log";
import { attachGuestContact, getOrCreateGuestThread } from "@/lib/help-db";
import {
  applyVisitorCookie,
  hashIp,
  isGuestEmailValid,
  mintVisitorKey,
  normalizeGuestName,
  readVisitorKeyFromCookies,
} from "@/lib/help-visitor";
import {
  extractTurnstileToken,
  verifyTurnstileToken,
} from "@/lib/turnstile";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  const gate = await verifyTurnstileToken({
    token: extractTurnstileToken(body),
    expectedAction: "help-guest",
    remoteip: clientIp(request),
  });
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const name = normalizeGuestName(body.name);
  const emailRaw = typeof body.email === "string" ? body.email : "";
  if (!name || !isGuestEmailValid(emailRaw)) {
    return NextResponse.json(
      { error: "Enter your name and a valid email." },
      { status: 400 }
    );
  }

  let visitorKey = await readVisitorKeyFromCookies();
  const minted = !visitorKey;
  if (!visitorKey) visitorKey = mintVisitorKey();

  const thread = await getOrCreateGuestThread(visitorKey);
  const updated = await attachGuestContact(thread.id, {
    name,
    email: emailRaw,
    ipHash: hashIp(clientIp(request)),
  });
  if (!updated) {
    return NextResponse.json({ error: "Could not save contact" }, { status: 400 });
  }

  const out = NextResponse.json({
    ok: true,
    hasContact: true,
    guestName: updated.guestName,
    guestEmail: updated.guestEmail,
  });
  if (minted) applyVisitorCookie(out, visitorKey);
  return out;
}

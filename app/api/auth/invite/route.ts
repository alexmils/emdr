import { NextResponse } from "next/server";
import { requirePlatformAdmin, isAuthContext } from "@/lib/api-auth";
import { inviteUserByEmail } from "@/lib/invite-user";
import { clientIp, writeAuditEvent } from "@/lib/audit-log";

export async function POST(request: Request) {
  const auth = await requirePlatformAdmin();
  if (!isAuthContext(auth)) return auth;

  try {
    const { email, name } = (await request.json()) as {
      email?: string;
      name?: string;
    };

    const result = await inviteUserByEmail(email ?? "", name, auth.user.id, {
      rollbackOnEmailFailure: true,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    const { user } = result;

    await writeAuditEvent({
      actorUserId: auth.user.id,
      targetUserId: user.id,
      action: "user.invited",
      detail: { email: user.email, name: user.name },
      ip: clientIp(request),
    });

    return NextResponse.json({
      ok: true,
      userId: user.id,
      email: user.email,
    });
  } catch (err) {
    console.error("[auth/invite]", err);
    return NextResponse.json({ error: "Invite failed" }, { status: 500 });
  }
}

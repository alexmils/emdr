import { NextResponse } from "next/server";
import {
  requireAdminAccess,
  requirePlatformAdminWrite,
  isAuthContext,
} from "@/lib/api-auth";
import { listAdminUsers } from "@/lib/admin-stats";
import { deleteAdminUser, updateAdminUser } from "@/lib/admin-users";
import { getUserById } from "@/lib/users";
import { inviteUserByEmail } from "@/lib/invite-user";
import { clientIp, writeAuditEvent } from "@/lib/audit-log";
import { isValidUserRole, type UserRole } from "@/lib/roles";

export async function GET(request: Request) {
  const auth = await requireAdminAccess();
  if (!isAuthContext(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit") ?? 50))
    );
    const users = await listAdminUsers(limit);
    return NextResponse.json({ users });
  } catch (err) {
    console.error("[admin/users GET]", err);
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requirePlatformAdminWrite();
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
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("[admin/users POST]", err);
    return NextResponse.json({ error: "Failed to invite user" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requirePlatformAdminWrite();
  if (!isAuthContext(auth)) return auth;

  try {
    const body = (await request.json()) as {
      id?: string;
      name?: string;
      role?: UserRole;
    };

    if (!body.id) {
      return NextResponse.json({ error: "User id is required" }, { status: 400 });
    }

    if (body.role !== undefined && !isValidUserRole(body.role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const result = await updateAdminUser(body.id, auth.user.id, {
      name: body.name,
      role: body.role,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await writeAuditEvent({
      actorUserId: auth.user.id,
      targetUserId: body.id,
      action: "user.updated",
      detail: { name: body.name, role: body.role },
      ip: clientIp(request),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/users PATCH]", err);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requirePlatformAdminWrite();
  if (!isAuthContext(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "User id is required" }, { status: 400 });
    }

    const userBefore = await getUserById(id);
    if (!userBefore) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await writeAuditEvent({
      actorUserId: auth.user.id,
      targetUserId: id,
      action: "user.deleted",
      detail: { email: userBefore.email },
      ip: clientIp(request),
    });

    const result = await deleteAdminUser(id, auth.user.id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/users DELETE]", err);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}

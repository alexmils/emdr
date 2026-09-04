import { NextResponse } from "next/server";
import { requireAdminAccess, isAuthContext } from "@/lib/api-auth";
import { listAuditEvents } from "@/lib/audit-log";

export async function GET(request: Request) {
  const auth = await requireAdminAccess();
  if (!isAuthContext(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      200,
      Math.max(1, Number(searchParams.get("limit") ?? 100))
    );
    const offset = Math.max(0, Number(searchParams.get("offset") ?? 0));
    const action = searchParams.get("action") ?? undefined;
    const search = searchParams.get("search") ?? undefined;

    const events = await listAuditEvents({
      limit,
      offset,
      action: action && action !== "all" ? action : undefined,
      search,
    });
    return NextResponse.json({ events });
  } catch (err) {
    console.error("[admin/events]", err);
    return NextResponse.json({ error: "Failed to load events" }, { status: 500 });
  }
}

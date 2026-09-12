import { NextResponse } from "next/server";
import { requireAdminAccess, isAuthContext } from "@/lib/api-auth";
import { fetchCoolifyAppHealth } from "@/lib/coolify";
import { probeDatabase } from "@/lib/health";
import {
  HEALTH_PATH,
  HEALTH_POLL_MS,
  scoreAdminHealth,
  type AdminHealthPayload,
} from "@/lib/health-shared";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminAccess();
  if (!isAuthContext(auth)) return auth;

  const [db, coolify] = await Promise.all([
    probeDatabase(),
    fetchCoolifyAppHealth(),
  ]);
  const scored = scoreAdminHealth({
    dbOk: db.ok,
    coolifyOk: coolify.ok,
    coolifyConfigured: coolify.configured,
  });

  const body: AdminHealthPayload = {
    ...scored,
    checkedAt: new Date().toISOString(),
    pollMs: HEALTH_POLL_MS,
    checks: {
      app: { ok: true, path: HEALTH_PATH },
      db,
      coolify,
    },
  };

  return NextResponse.json(body, {
    headers: { "Cache-Control": "no-store" },
  });
}

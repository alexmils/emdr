import { getPool } from "@/lib/db";
import type { PublicHealthPayload } from "@/lib/health-shared";

export {
  HEALTH_PATH,
  HEALTH_POLL_MS,
  coolifyChipLabel,
  coolifyIsHealthy,
  emptyCoolifyView,
  parseCoolifyStatus,
  scoreAdminHealth,
  type AdminHealthPayload,
  type CoolifyHealthView,
  type HealthFlag,
  type PublicHealthPayload,
} from "@/lib/health-shared";

const DB_TIMEOUT_MS = 2_500;

export async function probeDatabase(): Promise<{ ok: boolean; ms: number }> {
  const started = Date.now();
  if (!process.env.DATABASE_URL) {
    return { ok: false, ms: 0 };
  }
  try {
    const pool = getPool();
    await Promise.race([
      pool.query("SELECT 1"),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("timeout")), DB_TIMEOUT_MS);
      }),
    ]);
    return { ok: true, ms: Date.now() - started };
  } catch {
    return { ok: false, ms: Date.now() - started };
  }
}

export async function buildPublicHealth(): Promise<PublicHealthPayload> {
  const db = await probeDatabase();
  return {
    ok: db.ok,
    status: db.ok ? "ok" : "degraded",
    checks: { app: "ok", db: db.ok ? "ok" : "fail" },
  };
}

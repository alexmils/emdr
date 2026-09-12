/** Client-safe health types and labels. Do not import db/pg/Coolify fetch here. */

/** Public Coolify/Docker probe path. Keep this cheap — no schema, no auth. */
export const HEALTH_PATH = "/health";
export const HEALTH_POLL_MS = 10_000;

export type HealthFlag = "ok" | "fail";

export type PublicHealthPayload = {
  ok: boolean;
  status: "ok" | "degraded";
  checks: {
    app: HealthFlag;
    db: HealthFlag;
  };
};

export type CoolifyHealthView = {
  configured: boolean;
  reachable: boolean;
  ok: boolean;
  status: string | null;
  state: string | null;
  health: string | null;
  healthCheckEnabled: boolean | null;
  healthCheckPath: string | null;
};

export type AdminHealthPayload = {
  ok: boolean;
  status: "ok" | "degraded" | "down";
  score: number;
  checkedAt: string;
  pollMs: number;
  checks: {
    app: { ok: boolean; path: string };
    db: { ok: boolean; ms: number };
    coolify: CoolifyHealthView;
  };
};

export function parseCoolifyStatus(raw: string | null | undefined): {
  state: string;
  health: string | null;
} {
  const text = (raw ?? "").trim().toLowerCase();
  if (!text) return { state: "unknown", health: null };
  const idx = text.indexOf(":");
  if (idx === -1) return { state: text, health: null };
  return {
    state: text.slice(0, idx) || "unknown",
    health: text.slice(idx + 1) || null,
  };
}

export function coolifyIsHealthy(view: {
  configured: boolean;
  reachable: boolean;
  state: string | null;
  health: string | null;
}): boolean {
  if (!view.configured) return true;
  if (!view.reachable) return false;
  if ((view.state ?? "unknown") !== "running") return false;
  const health = view.health;
  if (!health || health === "healthy" || health === "unknown") return true;
  return false;
}

export function scoreAdminHealth(args: {
  dbOk: boolean;
  coolifyOk: boolean;
  coolifyConfigured: boolean;
}): Pick<AdminHealthPayload, "ok" | "status" | "score"> {
  if (!args.dbOk) return { ok: false, status: "down", score: 0 };
  if (args.coolifyConfigured && !args.coolifyOk) {
    return { ok: false, status: "degraded", score: 50 };
  }
  return { ok: true, status: "ok", score: 100 };
}

export function coolifyChipLabel(view: CoolifyHealthView): string {
  if (!view.configured) return "Coolify local";
  if (!view.reachable) return "Coolify unreachable";
  if (view.state && view.state !== "running") {
    return `Coolify ${view.state}`;
  }
  if (view.health === "unhealthy") return "Coolify unhealthy";
  if (view.ok) return "Coolify healthy";
  return "Coolify down";
}

export function emptyCoolifyView(configured: boolean): CoolifyHealthView {
  return {
    configured,
    reachable: false,
    ok: !configured,
    status: null,
    state: null,
    health: null,
    healthCheckEnabled: null,
    healthCheckPath: null,
  };
}

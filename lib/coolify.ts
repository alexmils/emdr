import {
  coolifyIsHealthy,
  emptyCoolifyView,
  parseCoolifyStatus,
  type CoolifyHealthView,
} from "@/lib/health-shared";

/** Public Coolify application uuid (not a secret). */
export const DEFAULT_COOLIFY_APP_UUID = "epufvmx1j8jold5gdpfak85m";
export const DEFAULT_COOLIFY_API_URL = "https://server.nurahelp.com";

export function getCoolifyConfig(): {
  token: string;
  apiUrl: string;
  uuid: string;
  configured: boolean;
} {
  const token = process.env.COOLIFY_TOKEN?.trim() ?? "";
  const apiUrl = (
    process.env.COOLIFY_API_URL?.trim() || DEFAULT_COOLIFY_API_URL
  ).replace(/\/$/, "");
  const uuid =
    process.env.COOLIFY_APP_UUID?.trim() || DEFAULT_COOLIFY_APP_UUID;
  return { token, apiUrl, uuid, configured: token.length > 0 };
}

type CoolifyApplicationPayload = {
  status?: unknown;
  health_check_enabled?: unknown;
  health_check_path?: unknown;
};

export async function fetchCoolifyAppHealth(): Promise<CoolifyHealthView> {
  const { token, apiUrl, uuid, configured } = getCoolifyConfig();
  if (!configured) return emptyCoolifyView(false);

  try {
    const res = await fetch(`${apiUrl}/api/v1/applications/${uuid}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return emptyCoolifyView(true);

    const data = (await res.json()) as CoolifyApplicationPayload;
    const status = typeof data.status === "string" ? data.status : null;
    const parsed = parseCoolifyStatus(status);
    const view: CoolifyHealthView = {
      configured: true,
      reachable: true,
      ok: false,
      status,
      state: parsed.state,
      health: parsed.health,
      healthCheckEnabled:
        typeof data.health_check_enabled === "boolean"
          ? data.health_check_enabled
          : null,
      healthCheckPath:
        typeof data.health_check_path === "string"
          ? data.health_check_path
          : null,
    };
    view.ok = coolifyIsHealthy(view);
    return view;
  } catch {
    return emptyCoolifyView(true);
  }
}

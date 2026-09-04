import type { AiProvider } from "@/lib/types";

export type CatalogProvider = AiProvider | "voice";

export type VoiceOption = { id: string; name: string };

export type CatalogFetch = (
  url: string,
  init?: RequestInit
) => Promise<Response>;

export class ProviderCatalogError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ProviderCatalogError";
    this.status = status;
  }
}

const OPENAI_CHAT_RE =
  /^(gpt-|o[1-9]|chatgpt-|codex-)/i;

function redactSecrets(text: string): string {
  return text
    .replace(/sk-ant-[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/sk-[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/xi_[A-Za-z0-9_-]+/g, "[redacted]");
}

export function sanitizeProviderError(status: number, body: string): string {
  const safe = redactSecrets(body).replace(/\s+/g, " ").trim().slice(0, 180);
  if (status === 401 || status === 403) return "Invalid API key";
  if (status === 429) return "Rate limited by provider";
  try {
    const parsed = JSON.parse(body) as {
      error?: { message?: string } | string;
      detail?: { message?: string } | string;
      message?: string;
    };
    const nested =
      typeof parsed.error === "string"
        ? parsed.error
        : parsed.error?.message;
    const detail =
      typeof parsed.detail === "string"
        ? parsed.detail
        : parsed.detail?.message;
    const msg = nested || detail || parsed.message;
    if (typeof msg === "string" && msg.trim()) {
      return redactSecrets(msg).trim().slice(0, 160);
    }
  } catch {
    /* use fallback */
  }
  if (safe) return `Provider error (${status}): ${safe}`;
  return `Provider error (${status})`;
}

async function providerGet(
  url: string,
  headers: Record<string, string>,
  fetchFn: CatalogFetch
): Promise<unknown> {
  let res: Response;
  try {
    res = await fetchFn(url, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(12_000),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    throw new ProviderCatalogError(redactSecrets(msg).slice(0, 160), 0);
  }

  const text = await res.text();
  if (!res.ok) {
    throw new ProviderCatalogError(
      sanitizeProviderError(res.status, text),
      res.status
    );
  }
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ProviderCatalogError("Invalid JSON from provider", res.status);
  }
}

function uniqueSorted(ids: string[]): string[] {
  return [...new Set(ids.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );
}

function openaiStyleIds(data: unknown): string[] {
  if (!data || typeof data !== "object") return [];
  const list = (data as { data?: unknown }).data;
  if (!Array.isArray(list)) return [];
  return list
    .map((item) =>
      item && typeof item === "object" && typeof (item as { id?: unknown }).id === "string"
        ? (item as { id: string }).id
        : ""
    )
    .filter(Boolean);
}

export async function listLlmModels(
  provider: AiProvider,
  apiKey: string,
  fetchFn: CatalogFetch = fetch
): Promise<string[]> {
  const key = apiKey.trim();
  if (!key) {
    throw new ProviderCatalogError("No API key", 400);
  }

  if (provider === "claude") {
    const data = await providerGet(
      "https://api.anthropic.com/v1/models?limit=1000",
      {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      fetchFn
    );
    return uniqueSorted(openaiStyleIds(data));
  }

  const url =
    provider === "deepseek"
      ? "https://api.deepseek.com/models"
      : "https://api.openai.com/v1/models";
  const data = await providerGet(
    url,
    { Authorization: `Bearer ${key}` },
    fetchFn
  );
  const ids = openaiStyleIds(data);
  if (provider === "openai") {
    const chat = ids.filter((id) => OPENAI_CHAT_RE.test(id));
    return uniqueSorted(chat.length ? chat : ids);
  }
  return uniqueSorted(ids);
}

export async function listVoiceCatalog(
  apiKey: string,
  fetchFn: CatalogFetch = fetch
): Promise<{ models: string[]; voices: VoiceOption[] }> {
  const key = apiKey.trim();
  if (!key) {
    throw new ProviderCatalogError("No API key", 400);
  }
  const headers = { "xi-api-key": key };

  const [modelsRaw, voicesRaw] = await Promise.all([
    providerGet("https://api.elevenlabs.io/v1/models", headers, fetchFn),
    providerGet("https://api.elevenlabs.io/v1/voices", headers, fetchFn),
  ]);

  const models: string[] = [];
  if (Array.isArray(modelsRaw)) {
    for (const item of modelsRaw) {
      if (!item || typeof item !== "object") continue;
      const row = item as {
        model_id?: unknown;
        can_do_text_to_speech?: unknown;
      };
      if (typeof row.model_id !== "string") continue;
      if (row.can_do_text_to_speech === false) continue;
      models.push(row.model_id);
    }
  }

  const voices: VoiceOption[] = [];
  const voiceList =
    voicesRaw && typeof voicesRaw === "object"
      ? (voicesRaw as { voices?: unknown }).voices
      : null;
  if (Array.isArray(voiceList)) {
    for (const item of voiceList) {
      if (!item || typeof item !== "object") continue;
      const row = item as { voice_id?: unknown; name?: unknown };
      if (typeof row.voice_id !== "string") continue;
      voices.push({
        id: row.voice_id,
        name: typeof row.name === "string" ? row.name : row.voice_id,
      });
    }
  }

  voices.sort((a, b) => a.name.localeCompare(b.name));
  return { models: uniqueSorted(models), voices };
}

export async function testProviderConnection(
  provider: CatalogProvider,
  apiKey: string,
  fetchFn: CatalogFetch = fetch
): Promise<{ ok: true } | { ok: false; error: string }> {
  const key = apiKey.trim();
  if (!key) return { ok: false, error: "No API key" };
  try {
    if (provider === "voice") {
      await listVoiceCatalog(key, fetchFn);
    } else {
      await listLlmModels(provider, key, fetchFn);
    }
    return { ok: true };
  } catch (err) {
    const message =
      err instanceof ProviderCatalogError
        ? err.message
        : "Connection failed";
    return { ok: false, error: redactSecrets(message) };
  }
}

export function envFallbackKey(provider: CatalogProvider): string {
  if (provider === "voice") return process.env.ELEVENLABS_API_KEY ?? "";
  if (provider === "deepseek") return process.env.DEEPSEEK_API_KEY ?? "";
  if (provider === "openai") return process.env.OPENAI_API_KEY ?? "";
  return process.env.ANTHROPIC_API_KEY ?? "";
}

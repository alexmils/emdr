import type { AiProvider } from "./types";
import type { LlmRuntimeConfig } from "./platform-settings";
import {
  recordLlmUsage,
  type LlmUsagePurpose,
} from "./llm-usage";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export type ChatCompletionMeta = {
  userId?: string | null;
  purpose?: LlmUsagePurpose;
};

type ParsedUsage = {
  promptTokens: number;
  completionTokens: number;
};

const PROVIDER_ORDER: AiProvider[] = ["deepseek", "openai", "claude"];

function envKeyFor(provider: AiProvider): string {
  const envKeys: Record<AiProvider, string | undefined> = {
    deepseek: process.env.DEEPSEEK_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    claude: process.env.ANTHROPIC_API_KEY,
  };
  return envKeys[provider]?.trim() || "";
}

/** Pick default provider if it has a key; otherwise first enabled connector with a key.
 *  Optional override: force provider and/or model (e.g. Help chat settings). */
export function resolveLlmProvider(
  settings: LlmRuntimeConfig,
  override?: { provider?: AiProvider | null; model?: string | null }
): {
  provider: AiProvider;
  key: string;
  model: string;
} | null {
  const modelOverride = override?.model?.trim() || "";
  const forced =
    override?.provider && PROVIDER_ORDER.includes(override.provider)
      ? override.provider
      : null;

  if (forced) {
    const cfg = settings.connectors[forced];
    if (!cfg || cfg.enabled === false) return null;
    const key = (cfg.apiKey || envKeyFor(forced)).trim();
    if (!key) return null;
    return {
      provider: forced,
      key,
      model: modelOverride || cfg.model,
    };
  }

  const preferred = settings.defaultAiProvider;
  const order: AiProvider[] = [
    preferred,
    ...PROVIDER_ORDER.filter((p) => p !== preferred),
  ];

  for (const provider of order) {
    const cfg = settings.connectors[provider];
    if (!cfg || cfg.enabled === false) continue;
    const key = (cfg.apiKey || envKeyFor(provider)).trim();
    if (!key) continue;
    return {
      provider,
      key,
      model: modelOverride || cfg.model,
    };
  }
  return null;
}

function parseOpenAiUsage(data: unknown): ParsedUsage | null {
  if (!data || typeof data !== "object") return null;
  const usage = (data as { usage?: Record<string, unknown> }).usage;
  if (!usage) return null;
  const prompt = Number(usage.prompt_tokens ?? 0);
  const completion = Number(usage.completion_tokens ?? 0);
  if (!Number.isFinite(prompt) || !Number.isFinite(completion)) return null;
  if (prompt <= 0 && completion <= 0) return null;
  return { promptTokens: prompt, completionTokens: completion };
}

function parseClaudeUsage(data: unknown): ParsedUsage | null {
  if (!data || typeof data !== "object") return null;
  const usage = (data as { usage?: Record<string, unknown> }).usage;
  if (!usage) return null;
  const prompt = Number(usage.input_tokens ?? 0);
  const completion = Number(usage.output_tokens ?? 0);
  if (!Number.isFinite(prompt) || !Number.isFinite(completion)) return null;
  if (prompt <= 0 && completion <= 0) return null;
  return { promptTokens: prompt, completionTokens: completion };
}

function trackUsage(
  meta: ChatCompletionMeta | undefined,
  provider: AiProvider,
  model: string,
  usage: ParsedUsage | null
) {
  if (!meta?.userId || !usage) return;
  void recordLlmUsage({
    userId: meta.userId,
    provider,
    model,
    purpose: meta.purpose ?? "guided_chat",
    promptTokens: usage.promptTokens,
    completionTokens: usage.completionTokens,
  }).catch((err) => console.warn("[llm] usage record failed:", err));
}

export async function chatCompletion(
  settings: LlmRuntimeConfig,
  messages: ChatMessage[],
  meta?: ChatCompletionMeta & {
    provider?: AiProvider | null;
    model?: string | null;
  }
): Promise<string> {
  const resolved = resolveLlmProvider(settings, {
    provider: meta?.provider,
    model: meta?.model,
  });
  if (!resolved) {
    throw new Error(
      "No API key configured for any AI provider (check Admin → AI & Voice)"
    );
  }

  const { provider, key, model } = resolved;

  if (provider === "claude") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 512,
        system: messages.find((m) => m.role === "system")?.content ?? "",
        messages: messages
          .filter((m) => m.role !== "system")
          .map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content,
          })),
      }),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    trackUsage(meta, provider, model, parseClaudeUsage(data));
    return data.content?.[0]?.text ?? "";
  }

  const baseUrl =
    provider === "deepseek"
      ? "https://api.deepseek.com"
      : "https://api.openai.com/v1";

  // gpt-5* models reject max_tokens and non-default temperature.
  // They also spend completion budget on hidden reasoning_tokens — keep headroom
  // so message.content is not empty (finish_reason: length).
  const isOpenAiGpt5 = provider === "openai" && /^gpt-5/i.test(model);
  const tokenLimit =
    provider === "openai"
      ? { max_completion_tokens: isOpenAiGpt5 ? 2048 : 512 }
      : { max_tokens: 512 };
  const sampling = isOpenAiGpt5 ? {} : { temperature: 0.4 };

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages,
      ...sampling,
      ...tokenLimit,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  trackUsage(meta, provider, model, parseOpenAiUsage(data));
  return data.choices?.[0]?.message?.content ?? "";
}

export async function synthesizeSpeech(
  settings: LlmRuntimeConfig,
  text: string,
  options?: { voiceId?: string; userId?: string | null }
): Promise<ArrayBuffer | null> {
  const cfg = settings.connectors.elevenlabs;
  const key = cfg.apiKey || process.env.ELEVENLABS_API_KEY || "";
  if (!key) return null;

  const trimmed = text.trim();
  if (!trimmed) return null;

  const voiceId =
    options?.voiceId?.trim() || cfg.voiceId || "EXAVITQu4vr4xnSDxMaL";
  const model = cfg.model || "eleven_multilingual_v2";
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": key,
      },
      body: JSON.stringify({
        text: trimmed,
        model_id: model,
      }),
    }
  );
  if (!res.ok) return null;

  // ElevenLabs bills per character — store as prompt_tokens for admin cost mix.
  const charCount = Array.from(trimmed).length;
  const userId = options?.userId?.trim();
  if (userId && charCount > 0) {
    void recordLlmUsage({
      userId,
      provider: "elevenlabs",
      model,
      purpose: "voice",
      promptTokens: charCount,
      completionTokens: 0,
    }).catch((err) => console.warn("[llm] voice usage record failed:", err));
  }

  return res.arrayBuffer();
}

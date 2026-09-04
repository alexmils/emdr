import type { AiProvider } from "./types";
import type { LlmRuntimeConfig } from "./platform-settings";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const PROVIDER_ORDER: AiProvider[] = ["deepseek", "openai", "claude"];

function envKeyFor(provider: AiProvider): string {
  const envKeys: Record<AiProvider, string | undefined> = {
    deepseek: process.env.DEEPSEEK_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    claude: process.env.ANTHROPIC_API_KEY,
  };
  return envKeys[provider]?.trim() || "";
}

/** Pick default provider if it has a key; otherwise first enabled connector with a key. */
export function resolveLlmProvider(settings: LlmRuntimeConfig): {
  provider: AiProvider;
  key: string;
  model: string;
} | null {
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
    return { provider, key, model: cfg.model };
  }
  return null;
}

export async function chatCompletion(
  settings: LlmRuntimeConfig,
  messages: ChatMessage[]
): Promise<string> {
  const resolved = resolveLlmProvider(settings);
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
  return data.choices?.[0]?.message?.content ?? "";
}

export async function synthesizeSpeech(
  settings: LlmRuntimeConfig,
  text: string
): Promise<ArrayBuffer | null> {
  const cfg = settings.connectors.elevenlabs;
  const key = cfg.apiKey || process.env.ELEVENLABS_API_KEY || "";
  if (!key) return null;

  const voiceId = cfg.voiceId || "EXAVITQu4vr4xnSDxMaL";
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": key,
      },
      body: JSON.stringify({
        text,
        model_id: cfg.model || "eleven_multilingual_v2",
      }),
    }
  );
  if (!res.ok) return null;
  return res.arrayBuffer();
}

import type { AiProvider, AppSettings } from "./types";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

function resolveApiKey(
  provider: AiProvider,
  settings: AppSettings
): { key: string; model: string } | null {
  const envKeys: Record<AiProvider, string | undefined> = {
    deepseek: process.env.DEEPSEEK_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    claude: process.env.ANTHROPIC_API_KEY,
  };
  const cfg = settings.connectors[provider];
  const key = cfg.apiKey || envKeys[provider] || "";
  if (!key) return null;
  return { key, model: cfg.model };
}

export async function chatCompletion(
  settings: AppSettings,
  messages: ChatMessage[]
): Promise<string> {
  const provider = settings.defaultAiProvider;
  const resolved = resolveApiKey(provider, settings);
  if (!resolved) {
    throw new Error(`No API key configured for ${provider}`);
  }

  if (provider === "claude") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": resolved.key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: resolved.model,
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

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resolved.key}`,
    },
    body: JSON.stringify({
      model: resolved.model,
      messages,
      max_tokens: 512,
      temperature: 0.4,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export async function synthesizeSpeech(
  settings: AppSettings,
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

/**
 * Estimated provider list prices (USD per 1M tokens).
 * Used for admin cost reporting only — not billing users.
 * Update when provider pricing changes.
 */
export type TokenRate = {
  inputPerMillion: number;
  outputPerMillion: number;
};

const MODEL_RATES: Record<string, TokenRate> = {
  // OpenAI
  "gpt-4.1-mini": { inputPerMillion: 0.4, outputPerMillion: 1.6 },
  "gpt-4.1": { inputPerMillion: 2, outputPerMillion: 8 },
  "gpt-4o-mini": { inputPerMillion: 0.15, outputPerMillion: 0.6 },
  "gpt-4o": { inputPerMillion: 2.5, outputPerMillion: 10 },
  "gpt-5-mini": { inputPerMillion: 0.25, outputPerMillion: 2 },
  "gpt-5": { inputPerMillion: 1.25, outputPerMillion: 10 },
  // DeepSeek
  "deepseek-chat": { inputPerMillion: 0.27, outputPerMillion: 1.1 },
  "deepseek-reasoner": { inputPerMillion: 0.55, outputPerMillion: 2.19 },
  // Anthropic
  "claude-3-5-haiku-latest": { inputPerMillion: 0.8, outputPerMillion: 4 },
  "claude-3-5-haiku-20241022": { inputPerMillion: 0.8, outputPerMillion: 4 },
  "claude-haiku-4-5": { inputPerMillion: 1, outputPerMillion: 5 },
  "claude-3-5-sonnet-latest": { inputPerMillion: 3, outputPerMillion: 15 },
  "claude-sonnet-4-5": { inputPerMillion: 3, outputPerMillion: 15 },
};

const PROVIDER_DEFAULTS: Record<string, TokenRate> = {
  openai: { inputPerMillion: 0.4, outputPerMillion: 1.6 },
  deepseek: { inputPerMillion: 0.27, outputPerMillion: 1.1 },
  claude: { inputPerMillion: 0.8, outputPerMillion: 4 },
};

export function resolveTokenRate(
  provider: string,
  model: string
): TokenRate {
  const exact = MODEL_RATES[model];
  if (exact) return exact;

  // Family match (longest key first so mini/haiku beat generic gpt-4 / sonnet)
  const keys = Object.keys(MODEL_RATES).sort((a, b) => b.length - a.length);
  const lower = model.toLowerCase();
  for (const key of keys) {
    const k = key.toLowerCase();
    if (lower === k || lower.startsWith(`${k}-`) || lower.startsWith(`${k}@`)) {
      return MODEL_RATES[key];
    }
  }

  if (/gpt-4\.1-mini|4\.1-mini/i.test(model)) {
    return MODEL_RATES["gpt-4.1-mini"];
  }
  if (/gpt-4o-mini/i.test(model)) return MODEL_RATES["gpt-4o-mini"];
  if (/gpt-4o/i.test(model)) return MODEL_RATES["gpt-4o"];
  if (/gpt-4\.1/i.test(model)) return MODEL_RATES["gpt-4.1"];
  if (/haiku/i.test(model)) return MODEL_RATES["claude-3-5-haiku-latest"];
  if (/sonnet/i.test(model)) return MODEL_RATES["claude-3-5-sonnet-latest"];
  if (/deepseek/i.test(model)) return MODEL_RATES["deepseek-chat"];

  return (
    PROVIDER_DEFAULTS[provider] ?? {
      inputPerMillion: 1,
      outputPerMillion: 3,
    }
  );
}

/** 1 USD = 1_000_000 micros */
export function estimateCostUsdMicros(
  provider: string,
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const rate = resolveTokenRate(provider, model);
  const input =
    (Math.max(0, promptTokens) / 1_000_000) * rate.inputPerMillion;
  const output =
    (Math.max(0, completionTokens) / 1_000_000) * rate.outputPerMillion;
  return Math.round((input + output) * 1_000_000);
}

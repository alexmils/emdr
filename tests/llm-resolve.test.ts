import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveLlmProvider } from "../lib/llm.ts";
import type { LlmRuntimeConfig } from "../lib/platform-settings.ts";
import type { AiProvider, ConnectorConfig } from "../lib/types.ts";

function cfg(
  defaultAiProvider: AiProvider,
  connectors: Partial<Record<AiProvider, Partial<ConnectorConfig>>>
): LlmRuntimeConfig {
  const empty = (model: string): ConnectorConfig => ({
    apiKey: "",
    model,
    enabled: true,
  });
  return {
    defaultAiProvider,
    connectors: {
      deepseek: { ...empty("deepseek-chat"), ...connectors.deepseek },
      openai: { ...empty("gpt-4.1-mini"), ...connectors.openai },
      claude: { ...empty("claude-3-5-haiku-latest"), ...connectors.claude },
      elevenlabs: {
        apiKey: "",
        model: "eleven_multilingual_v2",
        enabled: true,
        voiceId: "x",
      },
    },
  };
}

describe("resolveLlmProvider", () => {
  it("uses the default provider when it has a key", () => {
    const resolved = resolveLlmProvider(
      cfg("openai", { openai: { apiKey: "sk-test" } })
    );
    assert.equal(resolved?.provider, "openai");
    assert.equal(resolved?.key, "sk-test");
  });

  it("falls back to another provider when default has no key", () => {
    const resolved = resolveLlmProvider(
      cfg("openai", { deepseek: { apiKey: "ds-key" } })
    );
    assert.equal(resolved?.provider, "deepseek");
    assert.equal(resolved?.key, "ds-key");
  });

  it("skips disabled providers", () => {
    const resolved = resolveLlmProvider(
      cfg("openai", {
        openai: { apiKey: "sk-x", enabled: false },
        deepseek: { apiKey: "ds-key" },
      })
    );
    assert.equal(resolved?.provider, "deepseek");
  });

  it("returns null when no keys are available", () => {
    const prev = {
      deepseek: process.env.DEEPSEEK_API_KEY,
      openai: process.env.OPENAI_API_KEY,
      claude: process.env.ANTHROPIC_API_KEY,
    };
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    try {
      assert.equal(resolveLlmProvider(cfg("openai", {})), null);
    } finally {
      if (prev.deepseek !== undefined)
        process.env.DEEPSEEK_API_KEY = prev.deepseek;
      if (prev.openai !== undefined) process.env.OPENAI_API_KEY = prev.openai;
      if (prev.claude !== undefined)
        process.env.ANTHROPIC_API_KEY = prev.claude;
    }
  });
});

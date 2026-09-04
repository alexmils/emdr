import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_PLATFORM_SETTINGS,
  normalizeSettingsForTest,
} from "../lib/platform-settings.ts";

describe("openai guided model defaults", () => {
  it("defaults to gpt-4.1-mini for OpenAI", () => {
    assert.equal(
      DEFAULT_PLATFORM_SETTINGS.ai.connectors.openai.model,
      "gpt-4.1-mini"
    );
  });

  it("remaps gpt-5* reasoning models to the chat default", () => {
    const next = normalizeSettingsForTest({
      ...DEFAULT_PLATFORM_SETTINGS,
      ai: {
        ...DEFAULT_PLATFORM_SETTINGS.ai,
        connectors: {
          ...DEFAULT_PLATFORM_SETTINGS.ai.connectors,
          openai: {
            apiKey: "sk-x",
            model: "gpt-5-nano",
            enabled: true,
          },
        },
      },
    });
    assert.equal(next.ai.connectors.openai.model, "gpt-4.1-mini");
  });
});

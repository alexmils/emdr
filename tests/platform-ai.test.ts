import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_PLATFORM_SETTINGS,
  type PlatformSettings,
} from "../lib/platform-settings.ts";

describe("platform AI defaults", () => {
  it("includes AI and Voice connectors", () => {
    const s: PlatformSettings = DEFAULT_PLATFORM_SETTINGS;
    assert.equal(s.ai.defaultProvider, "openai");
    assert.equal(s.ai.connectors.openai.model, "gpt-4.1-mini");
    assert.ok(s.ai.connectors.deepseek.model);
    assert.ok(s.ai.voice.voiceId);
  });
});

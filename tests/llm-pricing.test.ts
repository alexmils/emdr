import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  estimateCostUsdMicros,
  resolveTokenRate,
} from "../lib/llm-pricing.ts";
import { formatTokenCount, formatUsdMicros } from "../lib/admin-llm-format.ts";

describe("llm-pricing", () => {
  it("resolves gpt-4.1-mini rates", () => {
    const rate = resolveTokenRate("openai", "gpt-4.1-mini");
    assert.equal(rate.inputPerMillion, 0.4);
    assert.equal(rate.outputPerMillion, 1.6);
  });

  it("estimates cost in USD micros", () => {
    // 1M input + 1M output at 0.4 / 1.6 = $2.00 = 2_000_000 micros
    const micros = estimateCostUsdMicros(
      "openai",
      "gpt-4.1-mini",
      1_000_000,
      1_000_000
    );
    assert.equal(micros, 2_000_000);
  });

  it("handles small token batches", () => {
    const micros = estimateCostUsdMicros("openai", "gpt-4.1-mini", 1000, 500);
    // (1000/1e6)*0.4 + (500/1e6)*1.6 = 0.0004 + 0.0008 = 0.0012 USD = 1200 micros
    assert.equal(micros, 1200);
  });

  it("falls back by provider for unknown models", () => {
    const rate = resolveTokenRate("deepseek", "deepseek-unknown-xyz");
    assert.equal(rate.inputPerMillion, 0.27);
  });

  it("estimates ElevenLabs multilingual cost per character", () => {
    // 1K chars at $0.10 / 1K = $0.10 = 100_000 micros
    const micros = estimateCostUsdMicros(
      "elevenlabs",
      "eleven_multilingual_v2",
      1000,
      0
    );
    assert.equal(micros, 100_000);
  });

  it("estimates ElevenLabs flash at half rate", () => {
    // 1K chars at $0.05 / 1K = $0.05 = 50_000 micros
    const micros = estimateCostUsdMicros(
      "elevenlabs",
      "eleven_flash_v2_5",
      1000,
      0
    );
    assert.equal(micros, 50_000);
  });
});

describe("admin-format llm helpers", () => {
  it("formats usd micros", () => {
    assert.match(formatUsdMicros(2_000_000), /2\.00/);
  });

  it("formats token counts", () => {
    assert.equal(formatTokenCount(0), "0");
    assert.equal(formatTokenCount(850), "850");
    assert.equal(formatTokenCount(12_400), "12k");
  });
});

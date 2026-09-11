import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildVoiceRibbonBand,
  buildVoiceWavePath,
  normalizeMicRms,
  rmsFromTimeDomain,
  smoothLevel,
  waveAmplitude,
} from "../lib/mic-level";

describe("mic-level", () => {
  it("rmsFromTimeDomain is ~0 for silence (128)", () => {
    const data = Uint8Array.from({ length: 32 }, () => 128);
    assert.ok(rmsFromTimeDomain(data) < 0.001);
  });

  it("rmsFromTimeDomain rises with amplitude", () => {
    const quiet = Uint8Array.from({ length: 32 }, () => 128);
    const loud = Uint8Array.from({ length: 32 }, (_, i) =>
      i % 2 === 0 ? 200 : 56
    );
    assert.ok(rmsFromTimeDomain(loud) > rmsFromTimeDomain(quiet));
  });

  it("normalizeMicRms gates noise and clamps", () => {
    assert.equal(normalizeMicRms(0.01), 0);
    assert.ok(normalizeMicRms(0.2) > 0.5);
    assert.equal(normalizeMicRms(1), 1);
  });

  it("smoothLevel attacks faster than it releases", () => {
    const up = smoothLevel(0, 1, 0.5, 0.1);
    const down = smoothLevel(1, 0, 0.5, 0.1);
    assert.ok(up > 0.4);
    assert.ok(down > 0.8);
  });

  it("waveAmplitude grows while listening", () => {
    assert.ok(waveAmplitude(0.9, "listening") > waveAmplitude(0.2, "listening"));
    assert.ok(waveAmplitude(0, "listening") >= 8);
    assert.ok(waveAmplitude(0, "listening") < waveAmplitude(0, "ambient"));
    assert.ok(
      waveAmplitude(0.9, "listening") > waveAmplitude(0.9, "ambient")
    );
  });

  it("buildVoiceWavePath uses smooth cubics across full width", () => {
    const d = buildVoiceWavePath(90, 54, 0.8, 14, 0);
    assert.ok(d.startsWith("M"));
    assert.ok(d.includes("C"));
    assert.equal(d.includes(" L"), false);
    assert.ok(d.includes("90.00") || d.includes("90.0"));
  });

  it("buildVoiceRibbonBand is a closed filled path", () => {
    const d = buildVoiceRibbonBand(90, 54, 0.5, 12, 7, 0);
    assert.ok(d.startsWith("M"));
    assert.ok(d.trimEnd().endsWith("Z"));
    assert.ok(d.includes("C"));
  });
});

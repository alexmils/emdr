import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
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

  it("waveAmplitude keeps a readable idle floor", () => {
    assert.ok(waveAmplitude(0, "listening") >= 18);
    assert.ok(waveAmplitude(0.8, "listening") > waveAmplitude(0.8, "ambient"));
    assert.ok(waveAmplitude(0.8, "ambient") > waveAmplitude(0, "quiet"));
  });

  it("buildVoiceWavePath has real vertical travel", () => {
    const d = buildVoiceWavePath(360, 72, 0.8, 22, 0);
    assert.ok(d.startsWith("M"));
    const ys = [...d.matchAll(/[\d.]+ ([\d.]+)/g)].map((m) => Number(m[1]));
    assert.ok(Math.max(...ys) - Math.min(...ys) > 20);
  });
});

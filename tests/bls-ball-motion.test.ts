import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BLS_BALL_MAX_DT_SEC,
  blsBallStep,
  blsBallVelocity,
} from "../lib/bls-ball-motion";

describe("bls-ball-motion", () => {
  it("matches legacy 60fps velocity (0.5 * Hz)", () => {
    assert.equal(blsBallVelocity(1), 0.5);
    assert.equal(blsBallVelocity(2), 1);
    const legacyStepAt60 = (1 / 60) / (1 / 1) * 0.5;
    assert.ok(Math.abs(blsBallStep(1, 1 / 60) - legacyStepAt60) < 1e-12);
  });

  it("scales with real frame dt (120Hz half of 60Hz step)", () => {
    const at60 = blsBallStep(1, 1 / 60);
    const at120 = blsBallStep(1, 1 / 120);
    assert.ok(Math.abs(at120 * 2 - at60) < 1e-12);
  });

  it("exposes a max dt cap for background tabs", () => {
    assert.equal(BLS_BALL_MAX_DT_SEC, 1 / 30);
  });
});

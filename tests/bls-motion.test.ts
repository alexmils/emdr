import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { motionAxisFromSize } from "../lib/bls-motion.ts";

describe("motionAxisFromSize", () => {
  it("uses horizontal for landscape / square", () => {
    assert.equal(motionAxisFromSize(844, 390), "horizontal");
    assert.equal(motionAxisFromSize(800, 800), "horizontal");
  });

  it("uses vertical for portrait", () => {
    assert.equal(motionAxisFromSize(390, 844), "vertical");
  });

  it("falls back safely for bad sizes", () => {
    assert.equal(motionAxisFromSize(0, 100), "horizontal");
    assert.equal(motionAxisFromSize(NaN, 100), "horizontal");
  });
});

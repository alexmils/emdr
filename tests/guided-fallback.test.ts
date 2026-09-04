import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { guidedFallbackReply } from "../lib/protocol.ts";

describe("guidedFallbackReply", () => {
  it("acknowledges a safe-place answer in grounding", () => {
    const line = guidedFallbackReply("grounding", "Ok I am in train");
    assert.match(line, /safe place/i);
    assert.doesNotMatch(line, /\(/);
    assert.doesNotMatch(line, /Ok I am in train/i);
    assert.doesNotMatch(line, /I'm here with you/i);
  });

  it("asks for NC after assessment content", () => {
    const line = guidedFallbackReply("assessment", "the crash");
    assert.match(line, /negative belief|I …/i);
  });
});

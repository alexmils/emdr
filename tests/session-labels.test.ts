import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  checkInPlaceholder,
  checkInQuickReplies,
  phaseLabel,
} from "../lib/session-labels.ts";

describe("session labels", () => {
  it("labels protocol phases", () => {
    assert.equal(phaseLabel("intake"), "Getting to know you");
    assert.equal(phaseLabel("desensitization"), "Desensitization");
    assert.equal(phaseLabel("body_scan"), "Body scan");
  });

  it("offers SUDs quick replies after desensitization sets", () => {
    const replies = checkInQuickReplies("desensitization");
    assert.ok(replies.some((r) => r.value.includes("SUDs is 0")));
    assert.ok(replies.some((r) => r.value.includes("SUDs is 10")));
  });

  it("offers intake topic quick replies", () => {
    const replies = checkInQuickReplies("intake");
    assert.ok(replies.some((r) => /anxiety/i.test(r.value)));
  });

  it("uses phase-specific check-in placeholders", () => {
    assert.match(checkInPlaceholder("intake"), /work on/i);
    assert.match(checkInPlaceholder("installation"), /VoC/i);
    assert.match(checkInPlaceholder("desensitization"), /SUDs/i);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractJsonObject,
  parseSessionInterpretation,
  threadPatchFromInterpretation,
} from "../lib/session-interpreter.ts";
import type { Thread } from "../lib/types.ts";

function baseThread(phase: Thread["phase"]): Thread {
  return {
    id: "t1",
    title: "Test",
    phase,
    incomplete: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe("session interpreter", () => {
  it("extracts JSON from fenced model output", () => {
    const raw = 'Sure.\n```json\n{"suds": 3, "voc": null, "distress": "ok", "needsGrounding": false, "summary": "mild"}\n```';
    const obj = extractJsonObject(raw) as Record<string, unknown>;
    assert.equal(obj.suds, 3);
  });

  it("parses and clamps scales", () => {
    const interp = parseSessionInterpretation({
      suds: 12,
      voc: -1,
      distress: "overwhelm",
      needsGrounding: false,
      suggestedPhase: "nope",
      summary: "x",
    });
    assert.equal(interp.suds, null);
    assert.equal(interp.voc, null);
    assert.equal(interp.distress, "overwhelm");
    assert.equal(interp.needsGrounding, true);
    assert.equal(interp.suggestedPhase, null);
  });

  it("forces grounding on overwhelm", () => {
    const patch = threadPatchFromInterpretation(baseThread("desensitization"), {
      suds: 9,
      voc: null,
      target: null,
      negativeCognition: null,
      positiveCognition: null,
      suggestedPhase: "installation",
      distress: "overwhelm",
      needsGrounding: true,
      summary: "flooded",
      userFacingHint: null,
    });
    assert.equal(patch.phase, "grounding");
  });

  it("advances desensitization to installation on low SUDs", () => {
    const patch = threadPatchFromInterpretation(
      baseThread("desensitization"),
      parseSessionInterpretation({
        suds: 1,
        distress: "ok",
        needsGrounding: false,
        summary: "calm",
      })
    );
    assert.equal(patch.phase, "installation");
    assert.equal(patch.suds, 1);
  });
});

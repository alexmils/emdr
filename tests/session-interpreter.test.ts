import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EMPTY_INTERPRETATION,
  extractJsonObject,
  parseSessionInterpretation,
  threadPatchFromInterpretation,
} from "../lib/session-interpreter.ts";
import type { Thread } from "../lib/types.ts";

function baseThread(phase: Thread["phase"]): Thread {
  return {
    id: "t1",
    title: "Test",
    mode: "guided",
    phase,
    incomplete: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe("session interpreter", () => {
  it("extracts JSON from fenced model output", () => {
    const raw =
      'Sure.\n```json\n{"suds": 3, "voc": null, "distress": "ok", "needsGrounding": false, "summary": "mild"}\n```';
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
      ...EMPTY_INTERPRETATION,
      suds: 9,
      suggestedPhase: "installation",
      distress: "overwhelm",
      needsGrounding: true,
      summary: "flooded",
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

  it("stays in intake until complete with a target", () => {
    const early = threadPatchFromInterpretation(
      baseThread("intake"),
      parseSessionInterpretation({
        presentingProblem: "anxiety at work",
        distress: "ok",
        intakeComplete: false,
        summary: "gathering",
      })
    );
    assert.equal(early.phase, undefined);
    assert.equal(early.intakeComplete, undefined);

    const ready = threadPatchFromInterpretation(
      baseThread("intake"),
      parseSessionInterpretation({
        presentingProblem: "anxiety at work",
        target: "criticism from boss last Tuesday",
        intakeComplete: true,
        distress: "ok",
        suggestedPhase: "grounding",
        summary: "ready",
      })
    );
    assert.equal(ready.phase, "grounding");
    assert.equal(ready.intakeComplete, true);
    assert.equal(ready.target, "criticism from boss last Tuesday");
  });

  it("forces grounding on intake risk flag", () => {
    const patch = threadPatchFromInterpretation(
      baseThread("intake"),
      parseSessionInterpretation({
        riskFlag: true,
        riskNotes: "active crisis",
        intakeComplete: true,
        target: "something",
        suggestedPhase: "grounding",
        distress: "elevated",
        summary: "risk",
      })
    );
    assert.equal(patch.phase, "grounding");
    assert.equal(patch.incomplete, true);
  });

  it("parses intake fields", () => {
    const interp = parseSessionInterpretation({
      presentingProblem: "panic attacks",
      historyNotes: "started after layoff",
      triggers: "emails from work",
      resources: "walks, friend",
      goals: "feel calmer at work",
      intakeComplete: true,
      riskFlag: false,
      distress: "ok",
    });
    assert.equal(interp.presentingProblem, "panic attacks");
    assert.equal(interp.intakeComplete, true);
    assert.equal(interp.riskFlag, false);
  });
});

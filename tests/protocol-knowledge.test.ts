import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  knowledgeBlockForPhase,
  PROTOCOL_KNOWLEDGE_VERSION,
  PHASE_KNOWLEDGE,
} from "../lib/protocol-knowledge.ts";
import { systemPromptForPhase } from "../lib/protocol.ts";

describe("protocol knowledge", () => {
  it("has a version string", () => {
    assert.match(PROTOCOL_KNOWLEDGE_VERSION, /^\d{4}-\d{2}-\d{2}/);
  });

  it("covers every app phase", () => {
    const phases = Object.keys(PHASE_KNOWLEDGE);
    assert.deepEqual(phases.sort(), [
      "assessment",
      "body_scan",
      "closure",
      "desensitization",
      "grounding",
      "installation",
    ]);
  });

  it("builds a non-empty knowledge block with safety language", () => {
    const block = knowledgeBlockForPhase("desensitization");
    assert.ok(block.length > 400);
    assert.match(block, /licensed clinician/i);
    assert.match(block, /Go with that/);
    assert.match(block, /What do you notice now/);
  });

  it("includes user memory only when provided", () => {
    const without = systemPromptForPhase("grounding", "");
    assert.ok(!without.includes("Enabled memory sets"));
    const withMem = systemPromptForPhase("grounding", "[Safe place]\n- beach");
    assert.match(withMem, /Enabled memory sets/);
    assert.match(withMem, /beach/);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";

/** Mirrors AgentOverlay: bubbles only after the first user reply. */
function conversationStarted(
  messages: { role: "agent" | "user" }[]
): boolean {
  return messages.some((m) => m.role === "user");
}

describe("agent overlay conversation gate", () => {
  it("stays in prompt mode with only the opening agent line", () => {
    assert.equal(conversationStarted([{ role: "agent" }]), false);
  });

  it("switches to thread mode after the first user reply", () => {
    assert.equal(
      conversationStarted([{ role: "agent" }, { role: "user" }]),
      true
    );
  });
});

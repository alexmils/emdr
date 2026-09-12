import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("help reply pop", () => {
  it("ships a Web Audio helper and wires it after assistant replies", () => {
    const sound = readFileSync(join(root, "lib/help-reply-sound.ts"), "utf8");
    assert.match(sound, /export function playHelpReplyPop/);
    assert.match(sound, /AudioContext/);

    const widget = readFileSync(
      join(root, "app/components/HelpChatWidget.tsx"),
      "utf8"
    );
    assert.match(widget, /playHelpReplyPop/);
    assert.match(widget, /assistantMessage/);
  });
});

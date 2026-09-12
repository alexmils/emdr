import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import {
  clampGuidedChatChromeId,
  GUIDED_CHAT_CHROMES,
  resolveGuidedChatChrome,
} from "../lib/guided-chat-chrome";
import { normalizeSettingsForTest } from "../lib/platform-settings";

describe("guided-chat-chrome", () => {
  it("lists 20 chrome looks", () => {
    assert.equal(GUIDED_CHAT_CHROMES.length, 20);
    assert.equal(GUIDED_CHAT_CHROMES[0]?.id, 1);
    assert.equal(GUIDED_CHAT_CHROMES[19]?.id, 20);
  });

  it("clamps chrome ids", () => {
    assert.equal(clampGuidedChatChromeId(0), 1);
    assert.equal(clampGuidedChatChromeId(99), 20);
    assert.equal(clampGuidedChatChromeId("14"), 14);
    assert.equal(clampGuidedChatChromeId("nope"), 1);
  });

  it("resolves theme avatar + voice colors", () => {
    const c = resolveGuidedChatChrome(2);
    assert.equal(c.title, "Recommended");
    assert.match(c.avatar, /C-white-on-sidebar/);
    assert.equal(c.theme.voiceBg, "#84B067");
  });

  it("ships every avatar file under public/", () => {
    const root = path.join(process.cwd(), "public");
    for (const chrome of GUIDED_CHAT_CHROMES) {
      const rel = chrome.avatar.replace(/^\//, "");
      assert.ok(
        existsSync(path.join(root, rel)),
        `missing avatar for chrome ${chrome.id}: ${chrome.avatar}`
      );
    }
  });
});

describe("platform settings guidedChatChromeId", () => {
  it("defaults and clamps on normalize", () => {
    const empty = normalizeSettingsForTest({});
    assert.equal(empty.guidedChatChromeId, 1);
    const high = normalizeSettingsForTest({
      siteName: "Nura",
      guidedChatChromeId: 99,
    });
    assert.equal(high.guidedChatChromeId, 20);
  });
});

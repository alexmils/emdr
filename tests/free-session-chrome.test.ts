import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clampFreeSessionChromeId,
  FREE_SESSION_CHROMES,
  freeSessionChromeCssVars,
  resolveFreeSessionChrome,
} from "../lib/free-session-chrome";
import { normalizeSettingsForTest } from "../lib/platform-settings";

describe("free-session-chrome", () => {
  it("lists 10 chrome looks", () => {
    assert.equal(FREE_SESSION_CHROMES.length, 10);
    assert.equal(FREE_SESSION_CHROMES[0]?.id, 1);
    assert.equal(FREE_SESSION_CHROMES[9]?.id, 10);
  });

  it("clamps chrome ids", () => {
    assert.equal(clampFreeSessionChromeId(0), 1);
    assert.equal(clampFreeSessionChromeId(99), 10);
    assert.equal(clampFreeSessionChromeId("7"), 7);
    assert.equal(clampFreeSessionChromeId("nope"), 1);
  });

  it("resolves theme title + css vars", () => {
    const c = resolveFreeSessionChrome(8);
    assert.equal(c.title, "Pistachio focus");
    const vars = freeSessionChromeCssVars(c.theme);
    assert.equal(vars["--fs-seg-active-ring"], "#c6d67e");
    assert.ok(vars["--fs-canvas"]);
    assert.ok(vars["--fs-dock-bg"]);
  });
});

describe("platform settings freeSessionChromeId", () => {
  it("defaults and clamps on normalize", () => {
    const empty = normalizeSettingsForTest({});
    assert.equal(empty.freeSessionChromeId, 1);
    const high = normalizeSettingsForTest({
      siteName: "Nura",
      freeSessionChromeId: 99,
    });
    assert.equal(high.freeSessionChromeId, 10);
  });
});

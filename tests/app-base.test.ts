import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  APP_BASE,
  LOGIN_PATH,
  appPath,
  isAppConsolePath,
  safeAppNext,
} from "../lib/app-base.ts";

describe("appPath", () => {
  it("maps root and relative paths under /app", () => {
    assert.equal(appPath(), APP_BASE);
    assert.equal(appPath("/"), APP_BASE);
    assert.equal(appPath("/settings"), "/app/settings");
    assert.equal(appPath("billing"), "/app/billing");
  });

  it("is idempotent for already-prefixed paths", () => {
    assert.equal(appPath("/app"), APP_BASE);
    assert.equal(appPath("/app/settings"), "/app/settings");
  });
});

describe("safeAppNext", () => {
  it("allows /app paths and query", () => {
    assert.equal(safeAppNext("/app"), APP_BASE);
    assert.equal(safeAppNext("/app/settings"), "/app/settings");
    assert.equal(safeAppNext("/app?checkout=1"), "/app?checkout=1");
  });

  it("rejects frontend and open-redirect candidates", () => {
    assert.equal(safeAppNext("/"), APP_BASE);
    assert.equal(safeAppNext("/login"), APP_BASE);
    assert.equal(safeAppNext("//evil.com"), APP_BASE);
    assert.equal(safeAppNext("https://evil.com"), APP_BASE);
    assert.equal(safeAppNext("/apple"), APP_BASE);
    assert.equal(safeAppNext(""), APP_BASE);
    assert.equal(safeAppNext(null), APP_BASE);
  });

  it("honors a safe fallback", () => {
    assert.equal(safeAppNext("/login", "/app/billing"), "/app/billing");
  });
});

describe("isAppConsolePath", () => {
  it("matches /app but not /apple", () => {
    assert.equal(isAppConsolePath("/app"), true);
    assert.equal(isAppConsolePath("/app/login"), true);
    assert.equal(isAppConsolePath("/app/resources"), true);
    assert.equal(isAppConsolePath("/apple"), false);
    assert.equal(isAppConsolePath("/"), false);
    assert.equal(isAppConsolePath(LOGIN_PATH), true);
  });
});

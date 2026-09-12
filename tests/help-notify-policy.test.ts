import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shouldSendHelpAdminEmail } from "../lib/help-notify-policy.ts";
import { safeAdminPushPath } from "../lib/admin-push-url.ts";

describe("shouldSendHelpAdminEmail", () => {
  it("sends on the first message of a new signed-in thread", () => {
    assert.equal(
      shouldSendHelpAdminEmail({
        priorUserMessageCount: 0,
        threadEmailAlreadySent: false,
        ipHash: null,
        ipEmailAlreadySent: false,
      }),
      true
    );
  });

  it("skips follow-up messages on the same thread", () => {
    assert.equal(
      shouldSendHelpAdminEmail({
        priorUserMessageCount: 1,
        threadEmailAlreadySent: false,
        ipHash: null,
        ipEmailAlreadySent: false,
      }),
      false
    );
  });

  it("skips when the thread already emailed", () => {
    assert.equal(
      shouldSendHelpAdminEmail({
        priorUserMessageCount: 0,
        threadEmailAlreadySent: true,
        ipHash: null,
        ipEmailAlreadySent: false,
      }),
      false
    );
  });

  it("sends for a guest on a new IP", () => {
    assert.equal(
      shouldSendHelpAdminEmail({
        priorUserMessageCount: 0,
        threadEmailAlreadySent: false,
        ipHash: "abc",
        ipEmailAlreadySent: false,
      }),
      true
    );
  });

  it("skips guests when that IP already triggered an email", () => {
    assert.equal(
      shouldSendHelpAdminEmail({
        priorUserMessageCount: 0,
        threadEmailAlreadySent: false,
        ipHash: "abc",
        ipEmailAlreadySent: true,
      }),
      false
    );
  });
});

describe("safeAdminPushPath", () => {
  const origin = "https://nurahelp.com";

  it("keeps same-origin /admin paths", () => {
    assert.equal(
      safeAdminPushPath("/admin/help?thread=1", origin),
      "/admin/help?thread=1"
    );
    assert.equal(
      safeAdminPushPath("https://nurahelp.com/admin/help", origin),
      "/admin/help"
    );
  });

  it("rejects external and non-admin paths", () => {
    assert.equal(
      safeAdminPushPath("https://evil.example/phish", origin),
      "/admin/help"
    );
    assert.equal(safeAdminPushPath("/app/settings", origin), "/admin/help");
    assert.equal(safeAdminPushPath("", origin), "/admin/help");
  });
});

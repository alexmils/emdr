import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isAccessAllowedPath,
  resolveAccessRedirect,
} from "../lib/access-gate.ts";

describe("access gate paths", () => {
  it("allows onboarding and auth screens", () => {
    assert.equal(isAccessAllowedPath("/app/onboarding"), true);
    assert.equal(isAccessAllowedPath("/app/login"), true);
    assert.equal(isAccessAllowedPath("/app/billing"), true);
    assert.equal(isAccessAllowedPath("/app"), false);
    assert.equal(isAccessAllowedPath("/app/settings"), true);
  });
});

describe("resolveAccessRedirect", () => {
  it("sends unfinished consumers to onboarding", () => {
    assert.equal(
      resolveAccessRedirect({
        role: "user",
        needsOnboarding: true,
        needsPayment: true,
        canUseApp: false,
        next: "/app",
      }),
      "/app/onboarding"
    );
  });

  it("sends unpaid finished-onboarding users to billing", () => {
    assert.equal(
      resolveAccessRedirect({
        role: "user",
        needsOnboarding: false,
        needsPayment: true,
        canUseApp: false,
        next: "/app",
      }),
      "/app/billing"
    );
  });

  it("sends admins to admin", () => {
    assert.equal(
      resolveAccessRedirect({
        role: "platform_admin",
        needsOnboarding: false,
        canUseApp: true,
      }),
      "/admin"
    );
  });
});

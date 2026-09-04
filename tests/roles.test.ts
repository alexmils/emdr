import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canViewAdmin,
  canWriteAdminUsers,
  isAdminRole,
  isValidUserRole,
  USER_ROLES,
} from "../lib/roles.ts";

describe("isValidUserRole", () => {
  it("accepts known roles", () => {
    for (const role of USER_ROLES) {
      assert.equal(isValidUserRole(role), true);
    }
  });

  it("rejects invalid roles", () => {
    assert.equal(isValidUserRole("superadmin"), false);
    assert.equal(isValidUserRole(""), false);
    assert.equal(isValidUserRole(null), false);
    assert.equal(isValidUserRole(undefined), false);
  });
});

describe("admin role helpers", () => {
  it("treats platform_admin and support as admin roles", () => {
    assert.equal(isAdminRole("platform_admin"), true);
    assert.equal(isAdminRole("support"), true);
    assert.equal(isAdminRole("user"), false);
  });

  it("allows admin view for platform_admin and support", () => {
    assert.equal(canViewAdmin("platform_admin"), true);
    assert.equal(canViewAdmin("support"), true);
    assert.equal(canViewAdmin("user"), false);
  });

  it("restricts write actions to platform_admin", () => {
    assert.equal(canWriteAdminUsers("platform_admin"), true);
    assert.equal(canWriteAdminUsers("support"), false);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  avatarTone,
  formatJoinedAt,
  userDirectoryStatus,
  userInitials,
  userPlanChip,
  userPlanLabel,
  userRoleLabel,
  userStatusLabel,
} from "../lib/admin-users-format.ts";

describe("userInitials", () => {
  it("uses first and last name", () => {
    assert.equal(userInitials("Olivia Rhye", "olivia@nurahelp.com"), "OR");
  });

  it("falls back to email local part", () => {
    assert.equal(userInitials(null, "noah.pierre@weblabs.studio"), "NO");
  });
});

describe("user directory labels", () => {
  it("maps roles and plans", () => {
    assert.equal(userRoleLabel("platform_admin"), "Admin");
    assert.equal(userRoleLabel("support"), "Support");
    assert.equal(userRoleLabel("user"), "User");
    assert.equal(userPlanLabel("yearly"), "Yearly");
    assert.equal(userPlanLabel("none"), "Free");
    assert.equal(userPlanChip("weekly"), "W");
    assert.equal(userPlanChip("free"), "F");
  });

  it("labels status without BLS jargon", () => {
    assert.equal(userStatusLabel("active"), "Active");
    assert.equal(userStatusLabel("pending"), "Pending invite");
    assert.equal(userStatusLabel("disabled"), "Disabled");
  });
});

describe("userDirectoryStatus", () => {
  it("marks disabled first", () => {
    assert.equal(
      userDirectoryStatus({
        status: "disabled",
        hasPassword: false,
        hasGoogle: false,
      }),
      "disabled"
    );
  });

  it("marks pending when there is no password or Google", () => {
    assert.equal(
      userDirectoryStatus({
        status: "active",
        hasPassword: false,
        hasGoogle: false,
      }),
      "pending"
    );
  });

  it("treats Google-only accounts as active", () => {
    assert.equal(
      userDirectoryStatus({
        status: "active",
        hasPassword: false,
        hasGoogle: true,
      }),
      "active"
    );
  });
});

describe("formatJoinedAt", () => {
  it("includes month and year", () => {
    const out = formatJoinedAt("2024-06-24T12:00:00.000Z");
    assert.match(out, /Jun/);
    assert.match(out, /2024/);
  });
});

describe("avatarTone", () => {
  it("stays in the 0–4 range", () => {
    assert.equal(avatarTone("abc") >= 0 && avatarTone("abc") <= 4, true);
  });
});

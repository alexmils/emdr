import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { roleFromJwtClaim } from "../lib/auth/session.ts";

describe("roleFromJwtClaim", () => {
  it("keeps platform_admin, support, and user", () => {
    assert.equal(roleFromJwtClaim("platform_admin"), "platform_admin");
    assert.equal(roleFromJwtClaim("support"), "support");
    assert.equal(roleFromJwtClaim("user"), "user");
  });

  it("drops unknown roles", () => {
    assert.equal(roleFromJwtClaim("superadmin"), undefined);
    assert.equal(roleFromJwtClaim(null), undefined);
    assert.equal(roleFromJwtClaim(undefined), undefined);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { adminPctChange } from "../lib/admin-stats.ts";

describe("adminPctChange", () => {
  it("returns 0 when both zero", () => {
    assert.equal(adminPctChange(0, 0), 0);
  });

  it("returns 100 when growing from zero", () => {
    assert.equal(adminPctChange(10, 0), 100);
  });

  it("computes relative change", () => {
    assert.equal(adminPctChange(110, 100), 10);
    assert.equal(adminPctChange(90, 100), -10);
  });
});

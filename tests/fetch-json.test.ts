import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FetchJsonError } from "../lib/fetch-json.ts";

describe("FetchJsonError", () => {
  it("carries HTTP status", () => {
    const err = new FetchJsonError("Unauthorized", 401);
    assert.equal(err.status, 401);
    assert.equal(err.name, "FetchJsonError");
    assert.match(err.message, /Unauthorized/);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatBlogDate } from "../lib/landing-blog.ts";

describe("formatBlogDate", () => {
  it("formats ISO dates for the blog byline", () => {
    assert.equal(formatBlogDate("2026-09-08T12:00:00.000Z"), "September 8, 2026");
  });

  it("returns empty string for invalid input", () => {
    assert.equal(formatBlogDate("not-a-date"), "");
  });
});

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getFeaturedResources,
  getResourceBySlug,
  getResourcesByKind,
  RESOURCES,
} from "../lib/resources-content";

describe("resources content", () => {
  it("returns featured articles only", () => {
    const featured = getFeaturedResources();
    assert.ok(featured.length >= 2);
    assert.ok(featured.every((r) => r.featured && r.kind === "article"));
  });

  it("finds resource by slug", () => {
    const item = getResourceBySlug("what-is-emdr");
    assert.equal(item?.title, "What is EMDR?");
    assert.ok(item?.body);
  });

  it("groups by kind", () => {
    const articles = getResourcesByKind("article");
    const safety = getResourcesByKind("safety");
    assert.ok(articles.length >= 3);
    assert.ok(safety.length >= 1);
    assert.equal(
      RESOURCES.filter((r) => r.kind === "article").length,
      articles.length
    );
  });
});

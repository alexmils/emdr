import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  cssBackgroundImageUrl,
  extractMarkdownImageUrls,
  isResourceKind,
  isValidResourceCoverUrl,
  isValidResourceSlug,
  isValidResourceVideoUrl,
  normalizeResourceSlug,
  postToResourceCard,
  resourceVideoEmbedUrl,
  slugifyTitle,
  type ResourcePost,
} from "../lib/resources.ts";
import {
  getFeaturedResources,
  getResourceBySlug,
  getResourcesByKind,
  SEED_RESOURCES,
} from "../lib/resources-content.ts";

describe("resources content seed", () => {
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
      SEED_RESOURCES.filter((r) => r.kind === "article").length,
      articles.length
    );
  });

  it("seed copy avoids BLS acronym and bilateral jargon", () => {
    for (const r of SEED_RESOURCES) {
      const blob = `${r.title} ${r.summary} ${r.body ?? ""}`;
      assert.equal(/\bBLS\b/.test(blob), false);
      assert.equal(/bilateral stimulation/i.test(blob), false);
    }
  });
});

describe("resources validation", () => {
  it("normalizes and validates slugs", () => {
    assert.equal(normalizeResourceSlug(" What Is EMDR? "), "what-is-emdr");
    assert.equal(isValidResourceSlug("what-is-emdr"), true);
    assert.equal(isValidResourceSlug("Bad Slug"), false);
    assert.equal(slugifyTitle("Hello World!"), "hello-world");
  });

  it("checks kinds", () => {
    assert.equal(isResourceKind("article"), true);
    assert.equal(isResourceKind("blog"), false);
  });

  it("accepts YouTube and Vimeo video URLs", () => {
    assert.equal(
      isValidResourceVideoUrl("https://www.youtube.com/watch?v=abc123"),
      true
    );
    assert.equal(isValidResourceVideoUrl("https://youtu.be/abc123"), true);
    assert.equal(isValidResourceVideoUrl("https://vimeo.com/123456"), true);
    assert.equal(isValidResourceVideoUrl("https://evil.example/x"), false);
    assert.equal(
      isValidResourceVideoUrl("https://cdn.example.com/clip.mp4"),
      true
    );
  });

  it("builds embed URLs", () => {
    assert.equal(
      resourceVideoEmbedUrl("https://www.youtube.com/watch?v=abc123"),
      "https://www.youtube.com/embed/abc123"
    );
    assert.equal(
      resourceVideoEmbedUrl("https://youtu.be/xyz"),
      "https://www.youtube.com/embed/xyz"
    );
    assert.equal(
      resourceVideoEmbedUrl("https://vimeo.com/42"),
      "https://player.vimeo.com/video/42"
    );
  });

  it("escapes cover URLs for CSS background-image", () => {
    assert.equal(
      cssBackgroundImageUrl('https://cdn.example.com/a"b.jpg'),
      'url("https://cdn.example.com/a\\"b.jpg")'
    );
    assert.equal(cssBackgroundImageUrl("javascript:alert(1)"), null);
    assert.equal(isValidResourceCoverUrl("https://cdn.example.com/x.png"), true);
  });

  it("allows https covers and jpeg/png/webp data URLs only", () => {
    assert.equal(isValidResourceCoverUrl("http://cdn.example.com/x.png"), false);
    assert.equal(isValidResourceCoverUrl("data:image/svg+xml;base64,YQ=="), false);
    assert.equal(
      isValidResourceCoverUrl("data:image/png;base64,iVBORw0KGgo="),
      true
    );
  });

  it("rejects non-allowlisted video hosts and http", () => {
    assert.equal(isValidResourceVideoUrl("http://youtube.com/watch?v=abc"), false);
    assert.equal(
      isValidResourceVideoUrl("https://evil.youtube.com.attacker/watch?v=a"),
      false
    );
  });

  it("extracts markdown image URLs", () => {
    assert.deepEqual(
      extractMarkdownImageUrls("Hi ![a](https://cdn.example.com/a.png) and ![b](data:image/png;base64,xx)"),
      ["https://cdn.example.com/a.png", "data:image/png;base64,xx"]
    );
  });

  it("card DTO omits body but sets hasBody", () => {
    const post: ResourcePost = {
      id: "1",
      slug: "demo",
      kind: "article",
      title: "Demo",
      summary: "Sum",
      body: "Full article text",
      coverUrl: null,
      videoUrl: null,
      readMinutes: 3,
      featured: false,
      enabled: true,
      sortOrder: 0,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const card = postToResourceCard(post);
    assert.equal(card.body, undefined);
    assert.equal(card.hasBody, true);
    assert.equal(card.title, "Demo");
  });
});

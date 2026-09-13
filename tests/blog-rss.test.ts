import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildBlogRssXml } from "@/lib/blog-rss";
import { listClusterArticles } from "@/lib/content-cluster";

describe("blog RSS", () => {
  it("emits RSS 2.0 with every cluster article", () => {
    const xml = buildBlogRssXml("https://nurahelp.com");
    assert.match(xml, /^<\?xml version="1\.0"/);
    assert.match(xml, /<rss version="2\.0"/);
    assert.match(xml, /<atom:link[^>]+\/blog\/rss\.xml/);
    assert.match(xml, /<link>https:\/\/nurahelp\.com\/blog<\/link>/);
    const articles = listClusterArticles();
    assert.ok(articles.length >= 10);
    for (const article of articles) {
      assert.match(xml, new RegExp(`/blog/${article.slug}`));
    }
  });
});

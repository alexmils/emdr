import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CLUSTER_ARTICLES,
  clusterHasBlsAcronym,
  clusterSitemapPaths,
  featuredClusterPosts,
  getClusterArticle,
  listClusterArticles,
  relatedClusterArticles,
} from "../lib/content-cluster.ts";
import { isFrontendPublicPath } from "../lib/public-paths.ts";

const REQUIRED_SLUGS = [
  "what-is-bilateral-stimulation",
  "emdr-vs-cbt",
  "emdr-between-sessions",
  "can-you-do-emdr-alone",
  "how-long-does-emdr-take",
  "emdr-for-anxiety",
  "emdr-for-ptsd",
] as const;

describe("content cluster", () => {
  it("ships 15–20 public articles with unique slugs", () => {
    assert.ok(CLUSTER_ARTICLES.length >= 15);
    assert.ok(CLUSTER_ARTICLES.length <= 20);
    const slugs = CLUSTER_ARTICLES.map((a) => a.slug);
    assert.equal(new Set(slugs).size, slugs.length);
    for (const slug of REQUIRED_SLUGS) {
      assert.ok(getClusterArticle(slug), slug);
    }
  });

  it("gives every article a descriptive /emdr anchor and valid related slugs", () => {
    for (const article of CLUSTER_ARTICLES) {
      assert.match(article.emdrAnchor, /Nura|session|visual set|moving ball/i);
      assert.ok(article.emdrAnchor.length > 24, article.slug);
      for (const related of relatedClusterArticles(article)) {
        assert.ok(related.slug);
        assert.notEqual(related.slug, article.slug);
      }
      assert.equal(
        relatedClusterArticles(article).length,
        article.related.length,
        article.slug
      );
    }
  });

  it("never says BLS in user-facing cluster copy", () => {
    assert.equal(clusterHasBlsAcronym(), false);
  });

  it("exposes /blog paths as public frontend routes", () => {
    assert.equal(isFrontendPublicPath("/blog"), true);
    assert.equal(isFrontendPublicPath("/blog/what-is-emdr"), true);
    for (const { path } of clusterSitemapPaths()) {
      assert.equal(isFrontendPublicPath(path), true);
      assert.match(path, /^\/blog\/[a-z0-9-]+$/);
    }
  });

  it("lists newest first and features enough posts for the home grid", () => {
    const listed = listClusterArticles();
    assert.equal(listed[0]?.slug, CLUSTER_ARTICLES.at(-1)?.slug);
    const featured = featuredClusterPosts(3);
    assert.equal(featured.length, 3);
    assert.ok(featured.every((p) => p.slug && p.title && p.summary));
  });
});

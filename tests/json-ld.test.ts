import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BRAND_SPOKEN } from "../lib/brand.ts";
import {
  CLUSTER_TOPICS,
  clusterArticlesByTopic,
  listClusterArticles,
} from "../lib/content-cluster.ts";
import { buildHomeJsonLd, serializeJsonLd } from "../lib/json-ld.ts";
import { LANDING_FAQ_ITEMS } from "../lib/landing-faq.ts";
import {
  BLOG_INDEX_JSON_LD,
  LEARN_JSON_LD,
  buildBlogIndexJsonLd,
  buildLearnJsonLd,
} from "../lib/seo-jsonld.ts";

describe("homepage JSON-LD", () => {
  it("emits Organization, SoftwareApplication, and FAQPage", () => {
    const data = buildHomeJsonLd("https://nurahelp.com");
    const types = data["@graph"].map((node) => node["@type"]);
    assert.deepEqual(types, [
      "Organization",
      "SoftwareApplication",
      "FAQPage",
    ]);
    assert.equal(data["@graph"][0]?.name, BRAND_SPOKEN);
    assert.equal(data["@graph"][0]?.legalName, "Receptly LLC");
    assert.deepEqual(data["@graph"][0]?.sameAs, [
      "https://www.instagram.com/nurahelpco/",
      "https://www.facebook.com/profile.php?id=61594147808052",
    ]);
    assert.equal(data["@graph"][1]?.operatingSystem, "Web");
    assert.equal(data["@graph"][1]?.name, BRAND_SPOKEN);
  });

  it("mirrors the visible FAQ strings", () => {
    const data = buildHomeJsonLd("https://nurahelp.com");
    const faq = data["@graph"].find((node) => node["@type"] === "FAQPage");
    const entities = faq?.mainEntity as {
      name: string;
      acceptedAnswer: { text: string };
    }[];
    assert.equal(entities.length, LANDING_FAQ_ITEMS.length);
    for (const [i, item] of LANDING_FAQ_ITEMS.entries()) {
      assert.equal(entities[i]?.name, item.q);
      assert.equal(entities[i]?.acceptedAnswer.text, item.a);
    }
  });

  it("does not invent native apps, BLS jargon, or a clinical reviewer", () => {
    const raw = serializeJsonLd(buildHomeJsonLd("https://nurahelp.com"));
    assert.equal(/BLS/i.test(raw), false);
    assert.equal(raw.includes("iOS"), false);
    assert.equal(raw.includes("Android"), false);
    assert.equal(raw.includes("MedicalWebPage"), false);
    assert.equal(raw.includes("reviewedBy"), false);
    assert.equal(raw.includes("NuraHelp AI"), false);
  });

  it("escapes < in JSON-LD payloads", () => {
    assert.equal(serializeJsonLd({ a: "<script>" }), '{"a":"\\u003cscript>"}');
  });
});

function graphTypes(data: { "@graph": { "@type": unknown }[] }) {
  return data["@graph"].map((node) => node["@type"]);
}

describe("learn hub JSON-LD", () => {
  const origin = "https://nurahelp.com";
  const data = buildLearnJsonLd(origin);
  const page = data["@graph"].find((node) => node["@type"] === "CollectionPage");
  const crumbs = data["@graph"].find((node) => node["@type"] === "BreadcrumbList");

  it("emits Organization, CollectionPage, and BreadcrumbList", () => {
    assert.deepEqual(graphTypes(data), [
      "Organization",
      "CollectionPage",
      "BreadcrumbList",
    ]);
    assert.equal(page?.name, LEARN_JSON_LD.name);
    assert.equal(page?.url, `${origin}/learn`);
  });

  it("lists guides in on-page topic order", () => {
    const groups = clusterArticlesByTopic();
    const expected = CLUSTER_TOPICS.flatMap((topic) => groups[topic]);
    const list = page?.mainEntity as {
      numberOfItems: number;
      itemListElement: { name: string; url: string; position: number }[];
    };
    assert.equal(list.numberOfItems, expected.length);
    assert.equal(list.itemListElement.length, expected.length);
    for (const [i, article] of expected.entries()) {
      assert.equal(list.itemListElement[i]?.position, i + 1);
      assert.equal(list.itemListElement[i]?.name, article.title);
      assert.equal(
        list.itemListElement[i]?.url,
        `${origin}/blog/${article.slug}`,
      );
    }
  });

  it("breadcrumbs Home → Learn", () => {
    const items = crumbs?.itemListElement as { name: string; item: string }[];
    assert.deepEqual(
      items.map((item) => [item.name, item.item]),
      [
        ["Home", `${origin}/`],
        ["Learn", `${origin}/learn`],
      ],
    );
  });
});

describe("blog index JSON-LD", () => {
  const origin = "https://nurahelp.com";
  const data = buildBlogIndexJsonLd(origin);
  const page = data["@graph"].find((node) =>
    Array.isArray(node["@type"])
      ? node["@type"].includes("Blog")
      : node["@type"] === "Blog",
  );
  const crumbs = data["@graph"].find((node) => node["@type"] === "BreadcrumbList");

  it("emits Organization, CollectionPage+Blog, and BreadcrumbList", () => {
    assert.deepEqual(graphTypes(data), [
      "Organization",
      ["CollectionPage", "Blog"],
      "BreadcrumbList",
    ]);
    assert.equal(page?.name, BLOG_INDEX_JSON_LD.name);
    assert.equal(page?.url, `${origin}/blog`);
  });

  it("lists posts newest first", () => {
    const articles = listClusterArticles();
    const list = page?.mainEntity as {
      numberOfItems: number;
      itemListElement: { name: string; url: string }[];
    };
    assert.equal(list.numberOfItems, articles.length);
    assert.equal(list.itemListElement[0]?.name, articles[0]?.title);
    assert.equal(
      list.itemListElement[0]?.url,
      `${origin}/blog/${articles[0]?.slug}`,
    );
    assert.equal(
      list.itemListElement.at(-1)?.url,
      `${origin}/blog/${articles.at(-1)?.slug}`,
    );
  });

  it("breadcrumbs Home → Blog", () => {
    const items = crumbs?.itemListElement as { name: string; item: string }[];
    assert.deepEqual(
      items.map((item) => [item.name, item.item]),
      [
        ["Home", `${origin}/`],
        ["Blog", `${origin}/blog`],
      ],
    );
  });

  it("does not invent BLS jargon or a clinical reviewer", () => {
    const raw = serializeJsonLd(data);
    assert.equal(/BLS/i.test(raw), false);
    assert.equal(raw.includes("MedicalWebPage"), false);
    assert.equal(raw.includes("NuraHelp AI"), false);
  });
});

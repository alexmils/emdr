import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildHomeJsonLd, serializeJsonLd } from "../lib/json-ld.ts";
import { LANDING_FAQ_ITEMS } from "../lib/landing-faq.ts";
import { BRAND_SPOKEN } from "../lib/brand.ts";

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

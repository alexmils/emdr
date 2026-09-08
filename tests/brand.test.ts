import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BRAND_LEGAL,
  BRAND_SPOKEN,
  chromeBrandName,
  rewriteRetiredBrandCopy,
} from "../lib/brand.ts";
import { normalizeSettingsForTest } from "../lib/platform-settings.ts";

describe("chromeBrandName", () => {
  it("maps leftover NuraHelp AI defaults to Nura", () => {
    assert.equal(chromeBrandName("NuraHelp AI"), BRAND_SPOKEN);
    assert.equal(chromeBrandName(""), BRAND_SPOKEN);
    assert.equal(chromeBrandName(null), BRAND_SPOKEN);
  });

  it("keeps a custom admin name", () => {
    assert.equal(chromeBrandName("Clinic Lab"), "Clinic Lab");
  });

  it("keeps legal lockup distinct from spoken name", () => {
    assert.equal(BRAND_LEGAL, "NuraHelp");
    assert.notEqual(BRAND_SPOKEN, BRAND_LEGAL);
  });

  it("maps stored NuraHelp AI platform defaults to Nura", () => {
    const s = normalizeSettingsForTest({
      siteName: "NuraHelp AI",
      fromName: "NuraHelp AI",
    });
    assert.equal(s.siteName, BRAND_SPOKEN);
    assert.equal(s.fromName, BRAND_SPOKEN);
  });
});

describe("rewriteRetiredBrandCopy", () => {
  it("strips NuraHelp AI and old help phrases", () => {
    assert.equal(rewriteRetiredBrandCopy("NuraHelp AI is a tool"), "Nura is a tool");
    assert.equal(
      rewriteRetiredBrandCopy("Hi — I’m the NuraHelp assistant."),
      "Hi — I’m the Nura assistant."
    );
    assert.equal(rewriteRetiredBrandCopy("What NuraHelp is"), "What Nura is");
  });
});

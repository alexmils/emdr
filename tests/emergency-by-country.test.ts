import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizeCountryCode,
  resourcesForCountry,
} from "../lib/emergency-by-country";

describe("normalizeCountryCode", () => {
  it("accepts ISO codes and drops Cloudflare placeholders", () => {
    assert.equal(normalizeCountryCode("rs"), "RS");
    assert.equal(normalizeCountryCode("XX"), null);
    assert.equal(normalizeCountryCode("T1"), null);
    assert.equal(normalizeCountryCode(""), null);
  });
});

describe("resourcesForCountry", () => {
  it("maps US to 911 emergency and 988 crisis", () => {
    const r = resourcesForCountry("US");
    assert.equal(r.emergency?.dial, "911");
    assert.equal(r.crisis?.dial, "988");
    assert.equal(r.crisis?.smsDial, "988");
    assert.match(r.countryName ?? "", /United States/i);
  });

  it("maps Serbia to 112 and national SOS", () => {
    const r = resourcesForCountry("RS");
    assert.equal(r.emergency?.dial, "112");
    assert.equal(r.crisis?.dial, "0800309309");
  });

  it("maps EU countries to 112", () => {
    assert.equal(resourcesForCountry("DE").emergency?.dial, "112");
    assert.equal(resourcesForCountry("HR").emergency?.dial, "112");
    assert.equal(resourcesForCountry("GB").emergency?.dial, "999");
    assert.equal(resourcesForCountry("AU").emergency?.dial, "000");
    assert.equal(resourcesForCountry("NZ").emergency?.dial, "111");
  });

  it("falls back safely when country is unknown", () => {
    const r = resourcesForCountry(null);
    assert.equal(r.emergency, null);
    assert.equal(r.crisis, null);
    assert.ok(r.findHelplineUrl.includes("iasp.info"));
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PENDING_LANDING_HASH_KEY,
  resolveLandingHash,
} from "../lib/landing-scroll";

describe("landing-scroll hash helpers", () => {
  it("resolveLandingHash prefers preferred id", () => {
    assert.equal(resolveLandingHash("#how-it-works"), "how-it-works");
    assert.equal(resolveLandingHash("prices"), "prices");
  });

  it("resolveLandingHash ignores bare home preferred", () => {
    // Without window/session, empty preferred / home yields empty or home only when preferred is home
    assert.equal(resolveLandingHash("home"), "home");
    assert.equal(resolveLandingHash(""), "");
  });

  it("pending key is stable for sessionStorage", () => {
    assert.equal(PENDING_LANDING_HASH_KEY, "nura-landing-hash");
  });
});

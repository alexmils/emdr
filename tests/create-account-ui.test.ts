import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createAccountPathWithSearch,
  initialCreateAccountStep,
  stripAuthErrorSearch,
} from "../lib/auth/create-account-ui.ts";

describe("initialCreateAccountStep", () => {
  it("always starts on methods so Google stays available after OAuth errors", () => {
    assert.equal(initialCreateAccountStep(null), "methods");
    assert.equal(
      initialCreateAccountStep("Google sign-in was cancelled. Try again."),
      "methods"
    );
  });
});

describe("stripAuthErrorSearch", () => {
  it("removes error and keeps next", () => {
    assert.equal(
      stripAuthErrorSearch("?error=google_cancelled&next=%2Fapp"),
      "?next=%2Fapp"
    );
    assert.equal(stripAuthErrorSearch("error=google&next=/app/onboarding"), "?next=%2Fapp%2Fonboarding");
  });

  it("returns empty when only error was present", () => {
    assert.equal(stripAuthErrorSearch("?error=google"), "");
    assert.equal(stripAuthErrorSearch(""), "");
  });
});

describe("createAccountPathWithSearch", () => {
  it("builds create-account URL without error", () => {
    assert.equal(
      createAccountPathWithSearch("?error=google_cancelled&next=%2Fapp"),
      "/app/create-account?next=%2Fapp"
    );
    assert.equal(
      createAccountPathWithSearch("?error=google"),
      "/app/create-account"
    );
  });
});

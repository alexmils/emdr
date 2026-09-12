import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isAuthPublicPath,
  isFrontendPublicPath,
  isUnauthenticatedPublicPath,
  legacyConsolePath,
  shouldRedirectToLoginOn401,
} from "../lib/public-paths.ts";

describe("isFrontendPublicPath", () => {
  it("allows site root and legal stubs", () => {
    assert.equal(isFrontendPublicPath("/"), true);
    assert.equal(isFrontendPublicPath("/privacy"), true);
    assert.equal(isFrontendPublicPath("/terms"), true);
    assert.equal(isFrontendPublicPath("/about"), true);
    assert.equal(isFrontendPublicPath("/emdr"), true);
    assert.equal(isFrontendPublicPath("/resources"), true);
    assert.equal(isFrontendPublicPath("/design/voice-composer"), true);
    assert.equal(isFrontendPublicPath("/therapy"), false);
    assert.equal(isFrontendPublicPath("/therapists"), false);
  });

  it("does not treat /app as frontend", () => {
    assert.equal(isFrontendPublicPath("/app"), false);
    assert.equal(isFrontendPublicPath("/app/login"), false);
  });
});

describe("isAuthPublicPath / isUnauthenticatedPublicPath", () => {
  it("allows auth screens under /app", () => {
    assert.equal(isAuthPublicPath("/app/login"), true);
    assert.equal(isUnauthenticatedPublicPath("/app/login"), true);
    assert.equal(isUnauthenticatedPublicPath("/app/forgot-password"), true);
    assert.equal(isUnauthenticatedPublicPath("/app/reset-password"), true);
    assert.equal(isUnauthenticatedPublicPath("/app/create-password"), true);
    assert.equal(isUnauthenticatedPublicPath("/app/create-account"), true);
    assert.equal(isUnauthenticatedPublicPath("/api/auth/register"), true);
  });

  it("prefix trap: /app itself is not public", () => {
    assert.equal(isUnauthenticatedPublicPath("/app"), false);
    assert.equal(isUnauthenticatedPublicPath("/app/settings"), false);
    assert.equal(isUnauthenticatedPublicPath("/apple"), false);
  });

  it("allows passkey login APIs and stripe webhook", () => {
    assert.equal(
      isUnauthenticatedPublicPath("/api/auth/passkey/login/options"),
      true
    );
    assert.equal(
      isUnauthenticatedPublicPath("/api/auth/passkey/login/verify"),
      true
    );
    assert.equal(isUnauthenticatedPublicPath("/api/webhooks/stripe"), true);
  });

  it("allows Google OAuth start and callback", () => {
    assert.equal(isUnauthenticatedPublicPath("/api/auth/google"), true);
    assert.equal(
      isUnauthenticatedPublicPath("/api/auth/google/callback"),
      true
    );
  });

  it("allows the public OG image route", () => {
    assert.equal(isUnauthenticatedPublicPath("/og-image"), true);
  });

  it("allows brand asset routes", () => {
    assert.equal(isUnauthenticatedPublicPath("/brand-assets/favicon"), true);
    assert.equal(isUnauthenticatedPublicPath("/brand-assets/app-logo"), true);
  });
});

describe("shouldRedirectToLoginOn401", () => {
  it("only redirects from product console", () => {
    assert.equal(shouldRedirectToLoginOn401("/app"), true);
    assert.equal(shouldRedirectToLoginOn401("/app/settings"), true);
    assert.equal(shouldRedirectToLoginOn401("/"), false);
    assert.equal(shouldRedirectToLoginOn401("/privacy"), false);
    assert.equal(shouldRedirectToLoginOn401("/emdr"), false);
    assert.equal(shouldRedirectToLoginOn401("/resources"), false);
    assert.equal(shouldRedirectToLoginOn401("/app/login"), false);
    assert.equal(shouldRedirectToLoginOn401("/apple"), false);
  });
});

describe("legacyConsolePath", () => {
  it("maps old bookmarks under /app", () => {
    assert.equal(legacyConsolePath("/login"), "/app/login");
    assert.equal(legacyConsolePath("/settings"), "/app/settings");
    assert.equal(
      legacyConsolePath("/reset-password"),
      "/app/reset-password"
    );
    assert.equal(legacyConsolePath("/billing"), "/app/billing");
    assert.equal(legacyConsolePath("/onboarding"), "/app/onboarding");
    assert.equal(legacyConsolePath("/create-account"), "/app/create-account");
    assert.equal(legacyConsolePath("/about"), null);
  });
});

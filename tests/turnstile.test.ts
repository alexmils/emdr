import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach, mock } from "node:test";
import {
  extractTurnstileToken,
  isPlausibleTurnstileToken,
  turnstileHostnames,
  verifyTurnstileToken,
  TURNSTILE_TOKEN_FIELD,
} from "../lib/turnstile.ts";

describe("extractTurnstileToken", () => {
  it("reads cf-turnstile-response", () => {
    assert.equal(
      extractTurnstileToken({ [TURNSTILE_TOKEN_FIELD]: "tok" }),
      "tok"
    );
    assert.equal(extractTurnstileToken({}), "");
    assert.equal(extractTurnstileToken(null), "");
  });
});

describe("isPlausibleTurnstileToken", () => {
  it("rejects empty and oversized", () => {
    assert.equal(isPlausibleTurnstileToken(""), false);
    assert.equal(isPlausibleTurnstileToken("ok"), true);
    assert.equal(isPlausibleTurnstileToken("x".repeat(2049)), false);
  });
});

describe("turnstileHostnames", () => {
  const prev = process.env.TURNSTILE_HOSTNAMES;
  afterEach(() => {
    if (prev === undefined) delete process.env.TURNSTILE_HOSTNAMES;
    else process.env.TURNSTILE_HOSTNAMES = prev;
  });

  it("parses comma list", () => {
    process.env.TURNSTILE_HOSTNAMES = "localhost, 127.0.0.1 ,dev.nurahelp.com";
    assert.deepEqual(
      [...turnstileHostnames()].sort(),
      ["127.0.0.1", "dev.nurahelp.com", "localhost"]
    );
  });
});

describe("verifyTurnstileToken", () => {
  const prevSecret = process.env.TURNSTILE_SECRET;
  const prevHosts = process.env.TURNSTILE_HOSTNAMES;
  let fetchMock: ReturnType<typeof mock.method> | null = null;

  beforeEach(() => {
    process.env.TURNSTILE_SECRET = "test-secret";
    process.env.TURNSTILE_HOSTNAMES = "localhost,127.0.0.1";
  });

  afterEach(() => {
    if (prevSecret === undefined) delete process.env.TURNSTILE_SECRET;
    else process.env.TURNSTILE_SECRET = prevSecret;
    if (prevHosts === undefined) delete process.env.TURNSTILE_HOSTNAMES;
    else process.env.TURNSTILE_HOSTNAMES = prevHosts;
    fetchMock?.mock.restore();
    fetchMock = null;
  });

  it("rejects when secret or hostnames missing", async () => {
    delete process.env.TURNSTILE_SECRET;
    const r = await verifyTurnstileToken({
      token: "abc",
      expectedAction: "login",
    });
    assert.equal(r.ok, false);
  });

  it("accepts success with matching action and hostname", async () => {
    fetchMock = mock.method(globalThis, "fetch", async () =>
      Response.json({
        success: true,
        action: "login",
        hostname: "localhost",
      })
    );
    const r = await verifyTurnstileToken({
      token: "fresh-token",
      expectedAction: "login",
    });
    assert.equal(r.ok, true);
  });

  it("rejects action mismatch", async () => {
    fetchMock = mock.method(globalThis, "fetch", async () =>
      Response.json({
        success: true,
        action: "signup",
        hostname: "localhost",
      })
    );
    const r = await verifyTurnstileToken({
      token: "fresh-token",
      expectedAction: "login",
    });
    assert.equal(r.ok, false);
  });

  it("rejects hostname not in allowlist", async () => {
    fetchMock = mock.method(globalThis, "fetch", async () =>
      Response.json({
        success: true,
        action: "login",
        hostname: "evil.example",
      })
    );
    const r = await verifyTurnstileToken({
      token: "fresh-token",
      expectedAction: "login",
    });
    assert.equal(r.ok, false);
  });
});

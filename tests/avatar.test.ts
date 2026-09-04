import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isValidAvatarDataUrl } from "../lib/users.ts";

describe("isValidAvatarDataUrl", () => {
  it("accepts jpeg/png/webp data urls", () => {
    assert.equal(
      isValidAvatarDataUrl("data:image/jpeg;base64,abc"),
      true
    );
    assert.equal(isValidAvatarDataUrl("data:image/png;base64,abc"), true);
    assert.equal(isValidAvatarDataUrl("data:image/webp;base64,abc"), true);
  });

  it("rejects non-images and oversize payloads", () => {
    assert.equal(isValidAvatarDataUrl("https://example.com/a.png"), false);
    assert.equal(isValidAvatarDataUrl("data:text/plain;base64,abc"), false);
    assert.equal(
      isValidAvatarDataUrl(`data:image/jpeg;base64,${"a".repeat(200_000)}`),
      false
    );
  });
});

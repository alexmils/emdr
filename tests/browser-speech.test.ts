import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isBrowserSpeechSupported } from "../lib/browser-speech.ts";

describe("browser-speech", () => {
  it("reports unsupported without a browser SpeechRecognition API", () => {
    assert.equal(isBrowserSpeechSupported(), false);
  });
});

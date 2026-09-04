import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  listLlmModels,
  listVoiceCatalog,
  sanitizeProviderError,
  testProviderConnection,
} from "../lib/provider-catalog.ts";

describe("sanitizeProviderError", () => {
  it("maps 401 to invalid key without echoing secrets", () => {
    const msg = sanitizeProviderError(401, "Unauthorized sk-abc123secret");
    assert.equal(msg, "Invalid API key");
    assert.equal(msg.includes("sk-abc"), false);
  });

  it("redacts keys in other status bodies", () => {
    const msg = sanitizeProviderError(500, "boom sk-live-secret-value");
    assert.equal(msg.includes("sk-live"), false);
    assert.match(msg, /\[redacted\]/);
  });
});

describe("listLlmModels", () => {
  it("parses OpenAI-compatible model ids and prefers chat models", async () => {
    const fetchFn = async () =>
      new Response(
        JSON.stringify({
          data: [
            { id: "whisper-1" },
            { id: "gpt-4o-mini" },
            { id: "text-embedding-3-small" },
          ],
        }),
        { status: 200 }
      );
    const models = await listLlmModels("openai", "sk-test", fetchFn);
    assert.deepEqual(models, ["gpt-4o-mini"]);
  });

  it("parses DeepSeek models", async () => {
    const fetchFn = async () =>
      new Response(
        JSON.stringify({ data: [{ id: "deepseek-chat" }, { id: "deepseek-reasoner" }] }),
        { status: 200 }
      );
    const models = await listLlmModels("deepseek", "sk-test", fetchFn);
    assert.deepEqual(models, ["deepseek-chat", "deepseek-reasoner"]);
  });

  it("does not throw raw secret on 401", async () => {
    const fetchFn = async () =>
      new Response("invalid sk-secret-key-here", { status: 401 });
    await assert.rejects(
      () => listLlmModels("openai", "sk-secret-key-here", fetchFn),
      (err: Error) => {
        assert.equal(err.message, "Invalid API key");
        assert.equal(err.message.includes("sk-secret"), false);
        return true;
      }
    );
  });
});

describe("listVoiceCatalog", () => {
  it("parses ElevenLabs models and voices", async () => {
    const fetchFn = async (url: string) => {
      if (url.includes("/models")) {
        return new Response(
          JSON.stringify([
            { model_id: "eleven_multilingual_v2", can_do_text_to_speech: true },
            { model_id: "voice-convert", can_do_text_to_speech: false },
          ]),
          { status: 200 }
        );
      }
      return new Response(
        JSON.stringify({
          voices: [
            { voice_id: "abc", name: "Rachel" },
            { voice_id: "xyz", name: "Adam" },
          ],
        }),
        { status: 200 }
      );
    };
    const catalog = await listVoiceCatalog("xi_test", fetchFn);
    assert.deepEqual(catalog.models, ["eleven_multilingual_v2"]);
    assert.equal(catalog.voices[0].name, "Adam");
  });
});

describe("testProviderConnection", () => {
  it("returns ok when list succeeds", async () => {
    const fetchFn = async () =>
      new Response(JSON.stringify({ data: [{ id: "claude-3-5-haiku-latest" }] }), {
        status: 200,
      });
    const result = await testProviderConnection("claude", "sk-ant-test", fetchFn);
    assert.deepEqual(result, { ok: true });
  });

  it("returns failed without leaking the key", async () => {
    const fetchFn = async () =>
      new Response("bad sk-secret-key-here", { status: 403 });
    const result = await testProviderConnection("openai", "sk-secret-key-here", fetchFn);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error, "Invalid API key");
      assert.equal(result.error.includes("sk-secret"), false);
    }
  });
});

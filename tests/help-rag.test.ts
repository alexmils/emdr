import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_HELP_SETTINGS,
  normalizeHelpSettings,
} from "../lib/help-settings.ts";
import {
  buildHelpSystemPrompt,
  rankKnowledgeDocs,
} from "../lib/help-rag.ts";

describe("help settings", () => {
  it("defaults when raw is empty", () => {
    const s = normalizeHelpSettings(undefined);
    assert.equal(s.enabled, true);
    assert.equal(s.aiFirstReply, true);
    assert.equal(s.notifyAdminsByEmail, true);
    assert.ok(s.welcomeMessage.includes("Nura assistant"));
    assert.equal(s.welcomeMessage.includes("NuraHelp AI"), false);
    assert.equal(s.welcomeMessage.includes("NuraHelp assistant"), false);
  });

  it("preserves custom allow/deny lists", () => {
    const s = normalizeHelpSettings({
      ...DEFAULT_HELP_SETTINGS,
      allowedTopics: "Billing only",
      deniedTopics: "Therapy",
      enabled: false,
    });
    assert.equal(s.enabled, false);
    assert.equal(s.allowedTopics, "Billing only");
    assert.equal(s.deniedTopics, "Therapy");
  });

  it("rewrites stored NuraHelp AI help copy", () => {
    const s = normalizeHelpSettings({
      ...DEFAULT_HELP_SETTINGS,
      welcomeMessage:
        "Hi — I’m the NuraHelp assistant. Ask about billing.",
      deniedTopics: "Anything unrelated to the NuraHelp product",
    });
    assert.equal(s.welcomeMessage.includes("NuraHelp"), false);
    assert.match(s.welcomeMessage, /Nura assistant/);
    assert.match(s.deniedTopics, /Nura product/);
  });
});

describe("help RAG", () => {
  it("ranks docs by keyword overlap", () => {
    const docs = [
      {
        title: "Crisis redirect",
        body: "Contact emergency services for crisis.",
        tags: ["safety"],
      },
      {
        title: "Billing and trial",
        body: "Trial includes guided sessions and Free mode minutes.",
        tags: ["billing", "trial"],
      },
      {
        title: "Session modes",
        body: "Guided vs Free mode (ball only).",
        tags: ["sessions"],
      },
    ];
    const ranked = rankKnowledgeDocs("how does billing trial work?", docs, 2);
    assert.equal(ranked[0]?.title, "Billing and trial");
    assert.ok(ranked.every((d) => d.title !== "Crisis redirect"));
  });

  it("builds system prompt with allow/deny and knowledge", () => {
    const prompt = buildHelpSystemPrompt(
      {
        ...DEFAULT_HELP_SETTINGS,
        allowedTopics: "Billing",
        deniedTopics: "Therapy advice",
        extraSystemNotes: "Mention portal for cancel.",
      },
      "### Billing\nTrial lasts 7 days."
    );
    assert.match(prompt, /ALLOWED TOPICS:/);
    assert.match(prompt, /Billing/);
    assert.match(prompt, /MUST NOT DISCUSS:/);
    assert.match(prompt, /Therapy advice/);
    assert.match(prompt, /EXTRA ADMIN NOTES:/);
    assert.match(prompt, /KNOWLEDGE BASE/);
    assert.match(prompt, /Trial lasts 7 days/);
  });
});

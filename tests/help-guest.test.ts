import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  GUEST_TRANSCRIPT_IDLE_MS,
  hashIp,
  isGuestEmailValid,
  isGuestTranscriptDue,
  isValidVisitorKey,
  normalizeGuestName,
} from "@/lib/help-visitor-core";
import {
  escapeHtml,
  formatHelpTranscript,
  helpThreadDisplayLabel,
  parseHelpBubbleSegments,
  sanitizeEmailHeaderValue,
  toPublicHelpThread,
} from "@/lib/help-format";
import { rewriteHelpKnowledgeCopy, type HelpThread } from "@/lib/help-db";

describe("help visitor helpers", () => {
  it("validates visitor UUID keys", () => {
    assert.equal(isValidVisitorKey("not-a-uuid"), false);
    assert.equal(
      isValidVisitorKey("550e8400-e29b-41d4-a716-446655440000"),
      true
    );
  });

  it("validates guest email and name", () => {
    assert.equal(isGuestEmailValid("a@b.co"), true);
    assert.equal(isGuestEmailValid("bad"), false);
    assert.equal(normalizeGuestName("  Ada  Lovelace "), "Ada Lovelace");
    assert.equal(normalizeGuestName(""), null);
  });

  it("requires AUTH_SECRET for IP hashing", () => {
    const prev = process.env.AUTH_SECRET;
    delete process.env.AUTH_SECRET;
    assert.equal(hashIp("1.2.3.4"), null);
    process.env.AUTH_SECRET = "test-secret-at-least-32-chars-long!!";
    assert.equal(typeof hashIp("1.2.3.4"), "string");
    assert.equal(hashIp("1.2.3.4")?.length, 64);
    if (prev === undefined) delete process.env.AUTH_SECRET;
    else process.env.AUTH_SECRET = prev;
  });

  it("gates transcript after 1h idle once only", () => {
    const now = Date.parse("2026-09-12T12:00:00.000Z");
    const base = {
      guestEmail: "guest@example.com",
      transcriptSentAt: null as string | null,
      lastActivityAt: "2026-09-12T10:30:00.000Z",
      hasUserMessage: true,
      nowMs: now,
      idleMs: GUEST_TRANSCRIPT_IDLE_MS,
    };
    assert.equal(isGuestTranscriptDue(base), true);
    assert.equal(
      isGuestTranscriptDue({
        ...base,
        lastActivityAt: "2026-09-12T11:30:00.000Z",
      }),
      false
    );
    assert.equal(
      isGuestTranscriptDue({
        ...base,
        transcriptSentAt: "2026-09-12T11:00:00.000Z",
      }),
      false
    );
    assert.equal(isGuestTranscriptDue({ ...base, guestEmail: null }), false);
    assert.equal(
      isGuestTranscriptDue({ ...base, hasUserMessage: false }),
      false
    );
  });
});

describe("help transcript formatting", () => {
  it("escapes HTML and formats roles", () => {
    assert.equal(escapeHtml(`a&b<"'>`), "a&amp;b&lt;&quot;&#39;&gt;");
    assert.equal(
      sanitizeEmailHeaderValue("Hi\r\nBcc: evil@x.com"),
      "Hi Bcc: evil@x.com"
    );

    const { text, html } = formatHelpTranscript([
      {
        id: "1",
        threadId: "t",
        role: "user",
        authorUserId: null,
        content: "Billing <script>alert(1)</script> & more",
        createdAt: "2026-09-12T10:00:00.000Z",
      },
      {
        id: "2",
        threadId: "t",
        role: "assistant",
        authorUserId: null,
        content: "Happy to help",
        createdAt: "2026-09-12T10:00:01.000Z",
      },
    ]);
    assert.match(text, /You: Billing <script>/);
    assert.match(html, /&lt;script&gt;/);
    assert.match(html, /&amp; more/);
    assert.doesNotMatch(html, /<script>/);
    assert.match(text, /Nura: Happy to help/);
  });

  it("strips visitorKey from public thread DTO", () => {
    const thread = {
      id: "g",
      userId: null,
      subject: "Help",
      status: "open",
      unreadAdmin: true,
      unreadUser: false,
      lastMessageAt: "2026-09-12T10:00:00.000Z",
      createdAt: "2026-09-12T10:00:00.000Z",
      updatedAt: "2026-09-12T10:00:00.000Z",
      visitorKey: "550e8400-e29b-41d4-a716-446655440000",
      guestEmail: "g@example.com",
    } as HelpThread;
    const pub = toPublicHelpThread(thread);
    assert.equal("visitorKey" in pub, false);
    assert.equal(pub.guestEmail, "g@example.com");
  });
});

describe("helpThreadDisplayLabel", () => {
  it("labels guests and users", () => {
    const guest = {
      id: "g",
      userId: null,
      subject: "Help",
      status: "open",
      unreadAdmin: true,
      unreadUser: false,
      lastMessageAt: "2026-09-12T10:00:00.000Z",
      createdAt: "2026-09-12T10:00:00.000Z",
      updatedAt: "2026-09-12T10:00:00.000Z",
      guestEmail: "g@example.com",
      guestName: null,
    } as HelpThread;
    assert.equal(helpThreadDisplayLabel(guest), "g@example.com");

    const user = {
      ...guest,
      userId: "u1",
      userEmail: "u@example.com",
      userName: "Alex",
      guestEmail: null,
    } as HelpThread;
    assert.equal(helpThreadDisplayLabel(user), "Alex");
  });
});

describe("help bubble links and knowledge copy", () => {
  it("parses markdown and bare price URLs", () => {
    const segs = parseHelpBubbleSegments(
      "See [current prices](https://nurahelp.com/#prices) or https://nurahelp.com/#prices."
    );
    const links = segs.filter((s) => s.type === "link");
    assert.equal(links.length, 2);
    assert.equal(links[0]?.type === "link" && links[0].label, "current prices");
    assert.equal(
      links[0]?.type === "link" && links[0].href,
      "https://nurahelp.com/#prices"
    );
    assert.equal(
      links[1]?.type === "link" && links[1].href,
      "https://nurahelp.com/#prices"
    );
  });

  it("scrubs payment vendor names from help knowledge", () => {
    const cleaned = rewriteHelpKnowledgeCopy(
      "Manage or cancel from Billing → Manage billing (Stripe Customer Portal)."
    );
    assert.doesNotMatch(cleaned, /Stripe/i);
    assert.match(cleaned, /Manage billing/);
  });
});

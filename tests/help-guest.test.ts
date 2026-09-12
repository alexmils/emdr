import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  GUEST_TRANSCRIPT_IDLE_MS,
  isGuestEmailValid,
  isGuestTranscriptDue,
  isValidVisitorKey,
  normalizeGuestName,
} from "@/lib/help-visitor-core";
import {
  formatHelpTranscript,
  helpThreadDisplayLabel,
} from "@/lib/help-format";
import type { HelpThread } from "@/lib/help-db";

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
    assert.equal(
      isGuestTranscriptDue({ ...base, guestEmail: null }),
      false
    );
    assert.equal(
      isGuestTranscriptDue({ ...base, hasUserMessage: false }),
      false
    );
  });
});

describe("help transcript formatting", () => {
  it("formats roles for email body", () => {
    const { text, html } = formatHelpTranscript([
      {
        id: "1",
        threadId: "t",
        role: "user",
        authorUserId: null,
        content: "Billing question",
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
    assert.match(text, /You: Billing question/);
    assert.match(text, /Nura: Happy to help/);
    assert.match(html, /<strong>You:<\/strong>/);
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

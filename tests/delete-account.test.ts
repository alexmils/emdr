import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  accountDeletedBillingNote,
  deleteConfirmPhraseMatches,
  emailsMatchForDeletion,
} from "../lib/delete-account-shared.ts";
import { renderEmailTemplate } from "../lib/email/templates.ts";

describe("emailsMatchForDeletion", () => {
  it("matches ignoring case and surrounding space", () => {
    assert.equal(
      emailsMatchForDeletion("  User@Example.com ", "user@example.com"),
      true
    );
  });

  it("rejects mismatched emails", () => {
    assert.equal(
      emailsMatchForDeletion("other@example.com", "user@example.com"),
      false
    );
    assert.equal(emailsMatchForDeletion("", "user@example.com"), false);
  });
});

describe("deleteConfirmPhraseMatches", () => {
  it("accepts DELETE ignoring case and space", () => {
    assert.equal(deleteConfirmPhraseMatches("DELETE"), true);
    assert.equal(deleteConfirmPhraseMatches(" delete "), true);
    assert.equal(deleteConfirmPhraseMatches("Delete"), true);
  });

  it("rejects other phrases", () => {
    assert.equal(deleteConfirmPhraseMatches("remove"), false);
    assert.equal(deleteConfirmPhraseMatches(""), false);
  });
});

describe("accountDeletedBillingNote", () => {
  it("covers no sub, canceled, and failed cancel", () => {
    assert.match(
      accountDeletedBillingNote({
        hadSubscription: false,
        canceled: false,
      }),
      /no active subscription/i
    );
    assert.match(
      accountDeletedBillingNote({
        hadSubscription: true,
        canceled: true,
      }),
      /was canceled/i
    );
    assert.match(
      accountDeletedBillingNote({
        hadSubscription: true,
        canceled: false,
      }),
      /could not cancel/i
    );
  });
});

describe("account_deleted email template", () => {
  it("uses billingNote and escapes HTML in the name", () => {
    const rendered = renderEmailTemplate(
      "account_deleted",
      {
        name: "Alex <script>alert(1)</script>",
        supportEmail: "hi@contact.nurahelp.com",
        homeUrl: "https://nurahelp.com/",
        billingNote: "Your subscription was canceled.",
      },
      "Nura"
    );
    assert.equal(rendered.subject, "Your account was deleted");
    assert.match(rendered.text, /Your subscription was canceled/);
    assert.match(rendered.html, /Your subscription was canceled/);
    assert.equal(rendered.html.includes("<script>"), false);
    assert.match(rendered.html, /&lt;script&gt;/);
    assert.match(rendered.html, /did not delete this account/i);
  });

  it("surfaces failed-cancel billing copy", () => {
    const rendered = renderEmailTemplate(
      "account_deleted",
      {
        name: "Alex",
        supportEmail: "hi@contact.nurahelp.com",
        homeUrl: "https://nurahelp.com/",
        billingNote:
          "We could not cancel your subscription automatically. Contact support so you are not charged.",
      },
      "Nura"
    );
    assert.match(rendered.text, /could not cancel/i);
    assert.doesNotMatch(rendered.text, /it was canceled/i);
  });
});

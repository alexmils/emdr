import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emailsMatchForDeletion } from "../lib/delete-account.ts";
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

describe("account_deleted email template", () => {
  it("confirms deletion and points to support", () => {
    const rendered = renderEmailTemplate(
      "account_deleted",
      {
        name: "Alex",
        supportEmail: "hi@contact.nurahelp.com",
        homeUrl: "https://nurahelp.com/",
      },
      "Nura"
    );
    assert.equal(rendered.subject, "Your account was deleted");
    assert.match(rendered.text, /have been deleted/i);
    assert.match(rendered.text, /hi@contact\.nurahelp\.com/);
    assert.match(rendered.html, /Account deleted/);
    assert.match(rendered.html, /did not delete this account/i);
  });
});

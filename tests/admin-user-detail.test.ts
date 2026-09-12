import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveLastLoginAt } from "../lib/audit-log.ts";
import {
  describeInvoicePayment,
  paymentStatusLabel,
} from "../lib/billing-event-format.ts";
import { formatMoney } from "../lib/admin-format.ts";

describe("resolveLastLoginAt", () => {
  it("prefers stored when no events", () => {
    assert.equal(
      resolveLastLoginAt("2026-09-10T12:00:00.000Z", null),
      "2026-09-10T12:00:00.000Z"
    );
  });

  it("uses event when stored is null", () => {
    assert.equal(
      resolveLastLoginAt(null, "2026-09-10T10:00:00.000Z"),
      "2026-09-10T10:00:00.000Z"
    );
  });

  it("picks the later of stored and event", () => {
    assert.equal(
      resolveLastLoginAt(
        "2026-09-09T12:00:00.000Z",
        "2026-09-10T12:00:00.000Z"
      ),
      "2026-09-10T12:00:00.000Z"
    );
    assert.equal(
      resolveLastLoginAt(
        "2026-09-11T12:00:00.000Z",
        "2026-09-10T12:00:00.000Z"
      ),
      "2026-09-11T12:00:00.000Z"
    );
  });
});

describe("describeInvoicePayment", () => {
  it("labels paid renewal and failed payment", () => {
    assert.match(
      describeInvoicePayment({
        eventType: "invoice.paid",
        amountCents: 499,
        currency: "eur",
        plan: "weekly",
        billingReason: "subscription_cycle",
      }),
      /Renewal · weekly/
    );
    assert.match(
      describeInvoicePayment({
        eventType: "invoice.payment_failed",
        amountCents: 1499,
        currency: "eur",
        plan: "monthly",
      }),
      /Payment failed/
    );
  });
});

describe("paymentStatusLabel", () => {
  it("maps known statuses", () => {
    assert.equal(paymentStatusLabel("succeeded"), "Paid");
    assert.equal(paymentStatusLabel("failed"), "Failed");
    assert.equal(paymentStatusLabel("trial_started"), "Trial started");
  });
});

describe("formatMoney cents", () => {
  it("shows dollars with cents when needed", () => {
    assert.match(formatMoney(499, "USD"), /4[.,]99/);
    assert.match(formatMoney(500, "USD"), /^\$5(\.00)?$/);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  financeCsv,
  financePlanKey,
  financePlanLabel,
  formatMoneyCompact,
  formatMoneyDelta,
  formatUpdatedAgo,
  mrrCentsForPlan,
  sharePct,
  stripeBannerCopy,
} from "../lib/admin-finance-format.ts";

describe("mrrCentsForPlan", () => {
  it("keeps monthly as-is", () => {
    assert.equal(mrrCentsForPlan("monthly", 1499), 1499);
  });

  it("divides yearly by 12", () => {
    assert.equal(mrrCentsForPlan("yearly", 9900), 825);
  });

  it("annualizes weekly", () => {
    assert.equal(mrrCentsForPlan("weekly", 499), Math.round((499 * 52) / 12));
  });

  it("zeros free plans", () => {
    assert.equal(mrrCentsForPlan("free", 1499), 0);
  });
});

describe("finance labels", () => {
  it("maps plan keys", () => {
    assert.equal(financePlanKey("yearly"), "yearly");
    assert.equal(financePlanKey("pro"), "other");
    assert.equal(financePlanLabel("weekly"), "Weekly");
  });

  it("computes share", () => {
    assert.equal(sharePct(25, 100), 25);
    assert.equal(sharePct(1, 0), 0);
  });
});

describe("finance formatters", () => {
  it("keeps small amounts uncompacted", () => {
    const out = formatMoneyCompact(1499, "EUR");
    assert.equal(/14/.test(out), true);
  });

  it("compacts large amounts", () => {
    const out = formatMoneyCompact(1_284_000, "EUR");
    assert.equal(out.includes("K"), true);
  });

  it("describes month deltas", () => {
    assert.equal(formatMoneyDelta(0, "EUR"), "Same as last month");
    assert.equal(formatMoneyDelta(41000, "EUR").includes("above last month"), true);
  });

  it("formats relative updates", () => {
    const now = Date.parse("2026-09-11T10:00:00.000Z");
    assert.equal(
      formatUpdatedAgo("2026-09-11T09:55:00.000Z", now),
      "Updated 5 min ago"
    );
  });
});

describe("stripeBannerCopy", () => {
  it("warns when catalog is incomplete", () => {
    const copy = stripeBannerCopy({
      demoMode: true,
      catalogReady: false,
      webhookReady: false,
    });
    assert.equal(copy.tone, "warn");
    assert.equal(copy.title.includes("catalog"), true);
  });

  it("names demo mode when ready", () => {
    const copy = stripeBannerCopy({
      demoMode: true,
      catalogReady: true,
      webhookReady: true,
    });
    assert.equal(copy.title, "Demo mode is on");
  });
});

describe("financeCsv", () => {
  it("escapes quotes and commas", () => {
    assert.equal(
      financeCsv([["a", 'say "hi", now'], [1, null]]),
      'a,"say ""hi"", now"\n1,'
    );
  });
});

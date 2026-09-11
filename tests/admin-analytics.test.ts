import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  firstNameFrom,
  formatAvgDuration,
  formatCountCompact,
  formatPct,
  parseAnalyticsDays,
  rangeLabel,
} from "../lib/admin-analytics-format.ts";

describe("parseAnalyticsDays", () => {
  it("defaults to 28", () => {
    assert.equal(parseAnalyticsDays("nope"), 28);
    assert.equal(parseAnalyticsDays(28), 28);
  });

  it("allows 7 and 84", () => {
    assert.equal(parseAnalyticsDays("7"), 7);
    assert.equal(parseAnalyticsDays(84), 84);
  });
});

describe("analytics formatters", () => {
  it("uses the first name", () => {
    assert.equal(firstNameFrom("Alexander Mils", "a@x.com"), "Alexander");
    assert.equal(firstNameFrom(null, "alex@nurahelp.com"), "alex");
  });

  it("compacts large counts", () => {
    assert.equal(formatCountCompact(24), "24");
    assert.equal(formatCountCompact(213100), "213.1k");
  });

  it("formats rates and duration", () => {
    assert.equal(formatPct(8.4), "8.4%");
    assert.equal(formatAvgDuration(192), "3m 12s");
    assert.equal(rangeLabel(28), "Last 4 weeks");
  });
});

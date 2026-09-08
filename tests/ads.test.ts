import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  publicAdsConfig,
  resolveAdDecision,
  shouldBeginBlsAfterAd,
  type AdDecisionState,
  type PlatformAdsSettings,
} from "../lib/ads.ts";

const baseConfig = {
  adsActive: true,
  frequencyMode: "per_session" as const,
  everyMinutes: 5,
  everyNSets: 3,
};

const emptyState: AdDecisionState = {
  sessionShownCount: 0,
  lastShownAt: null,
  setsSinceLastAd: 0,
};

describe("resolveAdDecision", () => {
  it("never shows when ads are inactive (paying / disabled)", () => {
    assert.equal(
      resolveAdDecision({ ...baseConfig, adsActive: false }, emptyState).show,
      false
    );
  });

  it("per_session shows only once", () => {
    assert.equal(
      resolveAdDecision(
        { ...baseConfig, frequencyMode: "per_session" },
        emptyState
      ).show,
      true
    );
    assert.equal(
      resolveAdDecision(
        { ...baseConfig, frequencyMode: "per_session" },
        { ...emptyState, sessionShownCount: 1 }
      ).show,
      false
    );
  });

  it("every_minutes respects cooldown", () => {
    const now = 1_000_000;
    assert.equal(
      resolveAdDecision(
        { ...baseConfig, frequencyMode: "every_minutes", everyMinutes: 5 },
        emptyState,
        now
      ).show,
      true
    );
    assert.equal(
      resolveAdDecision(
        { ...baseConfig, frequencyMode: "every_minutes", everyMinutes: 5 },
        { ...emptyState, lastShownAt: now - 60_000 },
        now
      ).show,
      false
    );
    assert.equal(
      resolveAdDecision(
        { ...baseConfig, frequencyMode: "every_minutes", everyMinutes: 5 },
        { ...emptyState, lastShownAt: now - 5 * 60_000 },
        now
      ).show,
      true
    );
  });

  it("every_n_sets shows after N completed sets", () => {
    assert.equal(
      resolveAdDecision(
        { ...baseConfig, frequencyMode: "every_n_sets", everyNSets: 3 },
        { ...emptyState, setsSinceLastAd: 2 }
      ).show,
      false
    );
    assert.equal(
      resolveAdDecision(
        { ...baseConfig, frequencyMode: "every_n_sets", everyNSets: 3 },
        { ...emptyState, setsSinceLastAd: 3 }
      ).show,
      true
    );
  });

  it("per_set always shows when active", () => {
    assert.equal(
      resolveAdDecision(
        { ...baseConfig, frequencyMode: "per_set" },
        { sessionShownCount: 99, lastShownAt: Date.now(), setsSinceLastAd: 0 }
      ).show,
      true
    );
  });
});

describe("publicAdsConfig", () => {
  const ads: PlatformAdsSettings = {
    enabled: true,
    provider: "adsense",
    adsenseClient: "ca-pub-123",
    adsenseSlot: "456",
    frequencyMode: "per_session",
    everyMinutes: 5,
    everyNSets: 3,
    minWatchSeconds: 5,
  };

  it("withholds details for non-trial users", () => {
    assert.deepEqual(publicAdsConfig(ads, false), { adsActive: false });
  });

  it("exposes config for trial users when enabled", () => {
    const pub = publicAdsConfig(ads, true);
    assert.equal(pub.adsActive, true);
    if (pub.adsActive) {
      assert.equal(pub.adsenseClient, "ca-pub-123");
      assert.equal(pub.provider, "adsense");
    }
  });

  it("stays inactive when master switch is off", () => {
    assert.deepEqual(publicAdsConfig({ ...ads, enabled: false }, true), {
      adsActive: false,
    });
  });
});

describe("shouldBeginBlsAfterAd", () => {
  it("starts BLS after continue or skip, not after upgrade", () => {
    assert.equal(shouldBeginBlsAfterAd("continued"), true);
    assert.equal(shouldBeginBlsAfterAd("skipped"), true);
    assert.equal(shouldBeginBlsAfterAd("upgraded"), false);
  });
});

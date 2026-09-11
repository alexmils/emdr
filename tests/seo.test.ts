import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  maskIpForDisplay,
  parseAnalyticsIgnoreIps,
  isIgnoredAnalyticsIp,
} from "../lib/analytics-ignore.ts";
import {
  isAllowedOgImageUrl,
  isValidClarityId,
  isValidGa4Id,
  isValidGtmId,
  maskPublicId,
  normalizeSeoConfig,
  parseServiceAccountEmail,
} from "../lib/seo-config.ts";
import {
  mergeSeoConfigPatch,
  toSeoAdminView,
  validateSeoConfigPatch,
} from "../lib/seo-admin-settings.ts";
import {
  buildMarketingSeoStatus,
  resolveSiteSeoPages,
  siteOrigin,
} from "../lib/site-seo.ts";
import {
  disconnectedSiteAnalytics,
  parseAnalyticsRange,
  parseGa4PropertyId,
} from "../lib/site-analytics.ts";
import {
  consentToMode,
  isGtmAllowedPath,
  isMarketingPublicPath,
} from "../lib/marketing-consent.ts";
import { normalizeSettingsForTest } from "../lib/platform-settings.ts";

describe("seo-config", () => {
  it("normalizes empty and validates public IDs", () => {
    const empty = normalizeSeoConfig(null);
    assert.equal(empty.ga4MeasurementId, "");
    assert.ok(isValidGa4Id("G-ABC123"));
    assert.ok(!isValidGa4Id("GTM-ABC"));
    assert.ok(isValidGtmId("GTM-WPH9W82M"));
    assert.ok(isValidClarityId("y27pwugoug"));
    assert.equal(maskPublicId("G-ABCDEFGH"), "••••EFGH");
  });

  it("allows only https or root-relative OG URLs", () => {
    assert.ok(isAllowedOgImageUrl("https://nurahelp.com/og.png"));
    assert.ok(isAllowedOgImageUrl("/brand/lockup.png"));
    assert.ok(!isAllowedOgImageUrl("http://insecure.example/x.png"));
    assert.ok(!isAllowedOgImageUrl("javascript:alert(1)"));
    assert.ok(!isAllowedOgImageUrl("//cdn.example/x.png"));
  });

  it("drops disallowed OG URLs on normalize", () => {
    const seo = normalizeSeoConfig({
      pages: { home: { ogImageUrl: "javascript:alert(1)" } },
    });
    assert.equal(seo.pages.home, undefined);
  });

  it("parses service account email", () => {
    assert.equal(
      parseServiceAccountEmail(
        JSON.stringify({ client_email: "bot@nura.iam.gserviceaccount.com" })
      ),
      "bot@nura.iam.gserviceaccount.com"
    );
    assert.equal(parseServiceAccountEmail("not-json"), null);
  });
});

describe("seo-admin-settings", () => {
  it("redacts secrets and keeps them on empty patch", () => {
    const current = normalizeSeoConfig({
      gscVerification: "secret-gsc",
      bingVerification: "secret-bing",
      googleServiceAccountJson: JSON.stringify({
        client_email: "sa@example.com",
        private_key: "x",
      }),
      ga4MeasurementId: "G-TEST",
    });
    const view = toSeoAdminView(current, true);
    assert.equal(view.gscVerification, "");
    assert.equal(view.hasGscVerification, true);
    assert.equal(view.serviceAccountEmail, "sa@example.com");
    assert.equal(view.ga4MeasurementId, "G-TEST");

    const merged = mergeSeoConfigPatch(current, {
      ga4MeasurementId: "G-NEW",
      gscVerification: "",
      googleServiceAccountJson: "",
    });
    assert.equal(merged.ga4MeasurementId, "G-NEW");
    assert.equal(merged.gscVerification, "secret-gsc");
    assert.ok(merged.googleServiceAccountJson.includes("sa@example.com"));
  });

  it("clears secrets when patch sends off", () => {
    const current = normalizeSeoConfig({
      gscVerification: "secret-gsc",
      bingVerification: "secret-bing",
      googleServiceAccountJson: JSON.stringify({
        client_email: "sa@example.com",
        private_key: "x",
      }),
    });
    const cleared = mergeSeoConfigPatch(current, {
      gscVerification: "off",
      bingVerification: "clear",
      googleServiceAccountJson: "-",
    });
    assert.equal(cleared.gscVerification, "");
    assert.equal(cleared.bingVerification, "");
    assert.equal(cleared.googleServiceAccountJson, "");
  });

  it("merges page overrides", () => {
    const current = normalizeSeoConfig({});
    const next = mergeSeoConfigPatch(current, {
      pages: { home: { title: "Custom Home", description: "Desc" } },
    });
    assert.equal(next.pages.home?.title, "Custom Home");
  });

  it("validates connection IDs on patch", () => {
    assert.deepEqual(validateSeoConfigPatch({ ga4MeasurementId: "G-OK12" }), []);
    assert.ok(
      validateSeoConfigPatch({ ga4MeasurementId: "bad" })[0]?.includes(
        "Google Analytics"
      )
    );
    assert.ok(
      validateSeoConfigPatch({ gtmId: "G-ABC" })[0]?.includes("Tag Manager")
    );
    assert.ok(
      validateSeoConfigPatch({
        pages: { home: { ogImageUrl: "http://x.com/a.png" } },
      })[0]?.includes("Share image")
    );
  });
});

describe("analytics-ignore", () => {
  it("parses IP lists and masks display", () => {
    assert.deepEqual(parseAnalyticsIgnoreIps(""), []);
    assert.deepEqual(parseAnalyticsIgnoreIps("off"), []);
    assert.deepEqual(parseAnalyticsIgnoreIps("1.2.3.4, 5.6.7.8"), [
      "1.2.3.4",
      "5.6.7.8",
    ]);
    assert.ok(isIgnoredAnalyticsIp("1.2.3.4", ["1.2.3.4"]));
    assert.equal(maskIpForDisplay("109.245.163.63"), "109.245...");
  });
});

describe("site-seo status", () => {
  it("builds connection cards from config", () => {
    const seo = normalizeSeoConfig({
      ga4MeasurementId: "G-ABCD1234",
      gtmId: "GTM-XXXXYYY",
      clarityId: "abcd1234",
      gscProperty: "sc-domain:nurahelp.com",
      ignoreIps: "10.0.0.1",
    });
    const pages = resolveSiteSeoPages(seo, "https://nurahelp.com");
    const status = buildMarketingSeoStatus(seo, pages, "https://nurahelp.com");
    assert.equal(status.canonical, "https://nurahelp.com/");
    const connected = status.connections.filter((c) => c.status === "connected");
    assert.ok(connected.length >= 5);
    const meta = status.connections.find((c) => c.id === "meta");
    assert.equal(meta?.status, "via_tag_manager");
  });

  it("uses publicAppUrl for site origin", () => {
    assert.equal(siteOrigin("https://dev.nurahelp.com/app"), "https://dev.nurahelp.com");
  });
});

describe("site-analytics helpers", () => {
  it("parses range and property id", () => {
    assert.equal(parseAnalyticsRange("28d"), "28d");
    assert.equal(parseAnalyticsRange("7"), "7d");
    assert.equal(parseGa4PropertyId("properties/123"), "123");
    assert.equal(parseGa4PropertyId("G-ABC"), null);
    const d = disconnectedSiteAnalytics("7d", { email: "a@b.com" });
    assert.equal(d.connected, false);
    assert.ok(d.setupNote);
  });
});

describe("marketing consent paths", () => {
  it("allows public marketing paths only", () => {
    assert.ok(isMarketingPublicPath("/"));
    assert.ok(isMarketingPublicPath("/about"));
    assert.ok(isMarketingPublicPath("/privacy"));
    assert.ok(!isMarketingPublicPath("/app"));
    assert.ok(!isMarketingPublicPath("/app/login"));
    assert.ok(!isMarketingPublicPath("/admin/seo"));
  });

  it("gates GTM to the same marketing paths", () => {
    assert.ok(isGtmAllowedPath("/emdr"));
    assert.ok(!isGtmAllowedPath("/app/settings"));
  });

  it("maps consent to Google Consent Mode", () => {
    assert.deepEqual(consentToMode(null), {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    assert.equal(
      consentToMode({
        analytics: true,
        marketing: false,
        updatedAt: "2026-01-01",
      }).analytics_storage,
      "granted"
    );
    assert.equal(
      consentToMode({
        analytics: true,
        marketing: false,
        updatedAt: "2026-01-01",
      }).ad_storage,
      "denied"
    );
  });
});

describe("platform settings seo block", () => {
  it("includes default seo on normalize", () => {
    const s = normalizeSettingsForTest({ siteName: "Nura" });
    assert.ok(s.seo);
    assert.equal(s.seo.ga4MeasurementId, "");
    assert.deepEqual(s.seo.pages, {});
  });
});

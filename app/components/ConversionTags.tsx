"use client";

import { MarketingTags } from "@/app/components/frontend/MarketingTags";

/**
 * Loads GA4/GTM/Clarity on conversion funnels (create-account, onboarding,
 * billing) so Meta Pixel inside GTM can receive CompleteRegistration / trial /
 * checkout events. Cookie banner stays on marketing pages only.
 */
export function ConversionTags() {
  return (
    <MarketingTags
      tags={{
        ga4MeasurementId: "",
        gtmId: "",
        clarityId: "",
        skipAnalytics: false,
        checkIgnoreIps: false,
      }}
    />
  );
}

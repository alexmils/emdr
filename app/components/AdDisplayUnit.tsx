"use client";

import { useEffect, useRef } from "react";
import {
  resolveAdsenseDisplaySlot,
  type PublicAdsConfig,
} from "@/lib/ads";
import { scheduleAdSensePush } from "@/lib/adsense-client";

type Props = {
  config: PublicAdsConfig;
  /** False until first billing/ads fetch finishes — reserves space to limit CLS. */
  adsReady?: boolean;
  /** Extra class on the outer shell (e.g. spacing in Resources). */
  className?: string;
};

/**
 * In-page display ad for trial users (Resources library / article).
 * Paying users get adsActive:false and this renders nothing once ready.
 */
export function AdDisplayUnit({
  config,
  adsReady = true,
  className = "",
}: Props) {
  if (!adsReady) {
    return (
      <aside
        className={`ad-display-unit ad-display-unit--pending ${className}`.trim()}
        aria-hidden="true"
      >
        <span className="ad-display-label">Sponsored</span>
        <div className="ad-display-skeleton" />
      </aside>
    );
  }

  if (!config.adsActive) return null;

  const slot = resolveAdsenseDisplaySlot(config);
  const showAdsense =
    config.provider === "adsense" &&
    Boolean(config.adsenseClient.trim()) &&
    Boolean(slot);

  return (
    <aside
      className={`ad-display-unit ${className}`.trim()}
      aria-label="Sponsored"
    >
      <span className="ad-display-label">Sponsored</span>
      {showAdsense ? (
        <AdSenseIns client={config.adsenseClient} slot={slot} />
      ) : (
        <div className="ad-display-placeholder">
          <p>
            {config.provider === "adsense" && !slot
              ? "Set a Resources display ad slot in Admin → Platform."
              : "Your ad could show here — go ad-free with a paid plan."}
          </p>
        </div>
      )}
    </aside>
  );
}

function AdSenseIns({ client, slot }: { client: string; slot: string }) {
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => scheduleAdSensePush(insRef.current), [client, slot]);

  return (
    <ins
      ref={insRef}
      className="adsbygoogle ad-display-ins"
      style={{ display: "block", minHeight: 100 }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}

"use client";

import Script from "next/script";

/**
 * Loads the AdSense script only when trial ads are active.
 * Paying users never mount this (no third-party script).
 */
export function AdSenseLoader({ clientId }: { clientId: string }) {
  const id = clientId.trim();
  if (!id) return null;
  return (
    <Script
      id="adsense-loader"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(id)}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}

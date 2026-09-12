"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  applyConsentToGtag,
  isGtmAllowedPath,
  readConsent,
} from "@/lib/marketing-consent";
import type { PublicMarketingTags } from "@/lib/site-seo-types";

/**
 * GA4, GTM, and Clarity load on marketing pages with consent defaults denied
 * so vendor install checkers can detect the tags without clicking Accept.
 * Cookie banner / localStorage then grant storage via Consent Mode / Clarity
 * consentv2. Ignored IPs skip via analytics-gate (not `headers()` in the page).
 */
export function MarketingTags({ tags }: { tags: PublicMarketingTags }) {
  const pathname = usePathname() || "/";
  const allowed = isGtmAllowedPath(pathname);
  const [ipSkip, setIpSkip] = useState(tags.skipAnalytics);
  const [ipChecked, setIpChecked] = useState(!tags.checkIgnoreIps);

  useEffect(() => {
    applyConsentToGtag(readConsent());
  }, []);

  useEffect(() => {
    if (!tags.checkIgnoreIps) {
      setIpSkip(tags.skipAnalytics);
      setIpChecked(true);
      return;
    }
    let cancelled = false;
    fetch("/api/marketing/analytics-gate")
      .then((res) => res.json() as Promise<{ skip?: boolean }>)
      .then((data) => {
        if (!cancelled) {
          setIpSkip(data.skip === true);
          setIpChecked(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIpSkip(false);
          setIpChecked(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tags.checkIgnoreIps, tags.skipAnalytics]);

  if (!ipChecked || ipSkip || tags.skipAnalytics || !allowed) return null;

  return (
    <>
      {/* Consent Mode default denied; cookie banner / localStorage call consent update. */}
      <Script id="nura-consent-default" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        window.gtag = gtag;
        gtag('consent', 'default', {
          analytics_storage: 'denied',
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
          wait_for_update: 500
        });
      `}</Script>

      {tags.ga4MeasurementId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${tags.ga4MeasurementId}`}
            strategy="afterInteractive"
          />
          <Script id="nura-ga4" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', '${tags.ga4MeasurementId}', {
              anonymize_ip: true,
              send_page_view: true
            });
          `}</Script>
        </>
      ) : null}

      {tags.gtmId ? (
        <Script id="nura-gtm" strategy="afterInteractive">{`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${tags.gtmId}');
        `}</Script>
      ) : null}

      {tags.clarityId ? (
        <Script
          id="nura-clarity"
          strategy="afterInteractive"
          onReady={() => applyConsentToGtag(readConsent())}
        >{`
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${tags.clarityId}");
        `}</Script>
      ) : null}
    </>
  );
}

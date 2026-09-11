"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CONSENT_UPDATE_EVENT,
  applyConsentToGtag,
  consentToMode,
  isGtmAllowedPath,
  readConsent,
} from "@/lib/marketing-consent";
import type { PublicMarketingTags } from "@/lib/site-seo";

/**
 * Loads GA4 / Clarity / GTM only on marketing paths after analytics consent.
 * Skipped entirely when Admin → SEO ignored IPs match the visitor.
 */
export function MarketingTags({ tags }: { tags: PublicMarketingTags }) {
  const pathname = usePathname() || "/";
  const allowed = isGtmAllowedPath(pathname);
  const [consent, setConsent] = useState(() =>
    typeof window !== "undefined" ? readConsent() : null
  );

  useEffect(() => {
    setConsent(readConsent());
    applyConsentToGtag(readConsent());
    const onUpdate = () => setConsent(readConsent());
    window.addEventListener(CONSENT_UPDATE_EVENT, onUpdate);
    return () => window.removeEventListener(CONSENT_UPDATE_EVENT, onUpdate);
  }, []);

  if (tags.skipAnalytics || !allowed) return null;

  const analyticsOk = consent?.analytics === true;
  const marketingOk = consent?.marketing === true;
  const mode = consentToMode(consent);

  return (
    <>
      <Script id="nura-consent-default" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        window.gtag = gtag;
        gtag('consent', 'default', {
          analytics_storage: '${mode.analytics_storage}',
          ad_storage: '${mode.ad_storage}',
          ad_user_data: '${mode.ad_user_data}',
          ad_personalization: '${mode.ad_personalization}',
          wait_for_update: 500
        });
      `}</Script>

      {analyticsOk && tags.ga4MeasurementId ? (
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
            gtag('config', '${tags.ga4MeasurementId}', { anonymize_ip: true });
          `}</Script>
        </>
      ) : null}

      {analyticsOk && tags.clarityId ? (
        <Script id="nura-clarity" strategy="afterInteractive">{`
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${tags.clarityId}");
        `}</Script>
      ) : null}

      {marketingOk && tags.gtmId ? (
        <Script id="nura-gtm" strategy="afterInteractive">{`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${tags.gtmId}');
        `}</Script>
      ) : null}
    </>
  );
}

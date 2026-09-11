"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  OPEN_COOKIE_SETTINGS_EVENT,
  isMarketingPublicPath,
  openCookieSettings,
  readConsent,
  writeConsent,
} from "@/lib/marketing-consent";

export function CookieSettingsButton({
  className,
}: {
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => openCookieSettings()}
      className={className ?? "fe-cookie-settings-btn"}
    >
      Cookie settings
    </button>
  );
}

export function CookieBanner() {
  const pathname = usePathname() || "/";
  const publicPath = isMarketingPublicPath(pathname);
  const [open, setOpen] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const existing = readConsent();
    if (existing) {
      setAnalytics(existing.analytics);
      setMarketing(existing.marketing);
    } else if (publicPath) {
      setOpen(true);
    }
    const onOpen = () => {
      const current = readConsent();
      if (current) {
        setAnalytics(current.analytics);
        setMarketing(current.marketing);
      }
      setCustomize(true);
      setOpen(true);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, onOpen);
  }, [publicPath]);

  if (!open || !publicPath) return null;

  function save(next: { analytics: boolean; marketing: boolean }) {
    writeConsent(next);
    setAnalytics(next.analytics);
    setMarketing(next.marketing);
    setOpen(false);
    setCustomize(false);
  }

  return (
    <div
      role="region"
      aria-label="Cookie choices"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-copy"
      className="fe-cookie-banner"
    >
      <div className="fe-cookie-banner-inner">
        <div className="fe-cookie-banner-copy">
          <p id="cookie-banner-title" className="fe-cookie-banner-title">
            Cookies on this site
          </p>
          <p id="cookie-banner-copy" className="fe-cookie-banner-text">
            We use cookies on public pages to understand visits. Necessary
            cookies always run. Analytics and marketing cookies wait for your
            choice.{" "}
            <Link href="/privacy">Privacy Policy</Link>
          </p>
          {customize ? (
            <div className="fe-cookie-opts">
              <label className="is-disabled">
                <input type="checkbox" checked disabled />
                <span>
                  <strong>Necessary</strong> — remembering this choice
                </span>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                />
                <span>
                  <strong>Analytics</strong> — visits and page use (Clarity,
                  Analytics)
                </span>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                />
                <span>
                  <strong>Marketing</strong> — Tag Manager and ads measurement
                </span>
              </label>
            </div>
          ) : null}
        </div>
        <div className="fe-cookie-banner-actions">
          {customize ? (
            <>
              <button
                type="button"
                className="fe-cookie-btn-secondary"
                onClick={() => save({ analytics: false, marketing: false })}
              >
                Reject optional
              </button>
              <button
                type="button"
                className="fe-cookie-btn-primary"
                onClick={() => save({ analytics, marketing })}
              >
                Save choices
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="fe-cookie-btn-secondary"
                onClick={() => setCustomize(true)}
              >
                Customize
              </button>
              <button
                type="button"
                className="fe-cookie-btn-secondary"
                onClick={() => save({ analytics: false, marketing: false })}
              >
                Reject optional
              </button>
              <button
                type="button"
                className="fe-cookie-btn-primary"
                onClick={() => save({ analytics: true, marketing: true })}
              >
                Accept all
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

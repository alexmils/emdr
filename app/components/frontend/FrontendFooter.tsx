"use client";

import Link from "next/link";
import {
  type FormEvent,
  type PointerEvent,
  useCallback,
  useRef,
  useState,
} from "react";
import { BrandLockup } from "@/app/components/BrandLockup";
import { BrandSocialLinks } from "@/app/components/BrandSocialLinks";
import { CookieSettingsButton } from "@/app/components/frontend/CookieBanner";
import { appPath, LOGIN_PATH } from "@/lib/app-base";
import { BRAND_SPOKEN, BRAND_TAGLINE } from "@/lib/brand";
import { legalEntityDisplayName } from "@/lib/legal-entity";
import { TRIAL_DAYS } from "@/lib/billing-constants";
import "./frontend-footer.css";

const FOOTER_LINKS = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/resources", label: "Resources" },
  { href: "/about", label: "About" },
  { href: "/editorial", label: "How we write" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

function MarqueeChunk() {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="fe-site-footer-marquee-item">
          <BrandLockup tone="white" className="fe-site-footer-marquee-logo" />
        </div>
      ))}
    </>
  );
}

export function FrontendFooter() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [spotlightOn, setSpotlightOn] = useState(false);
  const footerRef = useRef<HTMLElement | null>(null);
  const rafRef = useRef(0);

  const onPointerMove = useCallback((e: PointerEvent<HTMLElement>) => {
    const el = footerRef.current;
    if (!el) return;
    const { clientX, clientY } = e;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;
      el.style.setProperty("--fe-ft-spot-x", `${x}%`);
      el.style.setProperty("--fe-ft-spot-y", `${y}%`);
    });
  }, []);

  function onNewsletter(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    const q = new URLSearchParams({ email: trimmed });
    window.location.href = `${appPath("/create-account")}?${q.toString()}`;
    setSent(true);
  }

  return (
    <footer
      ref={footerRef}
      className={`fe-site-footer${spotlightOn ? " is-spotlight" : ""}`}
      onPointerEnter={() => setSpotlightOn(true)}
      onPointerLeave={() => {
        setSpotlightOn(false);
        cancelAnimationFrame(rafRef.current);
      }}
      onPointerMove={onPointerMove}
    >
      <div className="fe-site-footer-glow fe-site-footer-glow--cursor" aria-hidden />

      <div className="fe-site-footer-inner">
        <div className="fe-site-footer-cta">
          <h2 className="fe-site-footer-cta-title">
            Support that stays calm — start when you are ready
          </h2>
          <p className="fe-site-footer-cta-sub">
            Built for practice between sessions. Create an account for a{" "}
            {TRIAL_DAYS}-day trial, or sign in if you already use {BRAND_SPOKEN}.
          </p>
          <div className="fe-site-footer-cta-actions">
            <Link
              href={appPath("/create-account")}
              className="fe-site-footer-cta-btn fe-site-footer-cta-btn--primary"
            >
              Get started
            </Link>
            <Link
              href={LOGIN_PATH}
              className="fe-site-footer-cta-btn fe-site-footer-cta-btn--ghost"
            >
              Sign in
            </Link>
          </div>
        </div>

        <div className="fe-site-footer-panel">
          <div className="fe-site-footer-brand-row">
            <BrandLockup href="/" tone="white" className="fe-site-footer-logo" />
            <div className="fe-site-footer-social" aria-label="Social">
              <BrandSocialLinks
                className="fe-site-footer-social-brand"
                linkClassName="fe-site-footer-social-link"
                labelled={false}
              />
            </div>
          </div>

          <div className="fe-site-footer-middle">
            <div className="fe-site-footer-lead">
              <p className="fe-site-footer-tagline">
                Join {BRAND_SPOKEN} today — calm guided support when you need it.
              </p>
              <div className="fe-site-footer-marquee" aria-hidden>
                <div className="fe-site-footer-marquee-track">
                  <MarqueeChunk />
                  <MarqueeChunk />
                </div>
                <div className="fe-site-footer-marquee-fade fe-site-footer-marquee-fade--left" />
                <div className="fe-site-footer-marquee-fade fe-site-footer-marquee-fade--right" />
              </div>
            </div>

            <div className="fe-site-footer-newsletter">
              <p className="fe-site-footer-newsletter-title">
                Join our newsletter!
              </p>
              {sent ? (
                <p className="fe-site-footer-newsletter-done">
                  Continue in create account to stay in touch.
                </p>
              ) : (
                <form
                  className="fe-site-footer-form"
                  onSubmit={onNewsletter}
                  noValidate
                >
                  <label className="fe-site-footer-sr" htmlFor="fe-footer-email">
                    Email
                  </label>
                  <input
                    id="fe-footer-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    placeholder="Enter your email here"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="fe-site-footer-input"
                  />
                  <button type="submit" className="fe-site-footer-send">
                    Send
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="fe-site-footer-bottom">
            <nav className="fe-site-footer-nav" aria-label="Footer">
              {FOOTER_LINKS.map((l) => (
                <Link key={l.href} href={l.href}>
                  {l.label}
                </Link>
              ))}
              <CookieSettingsButton className="fe-site-footer-cookie-btn" />
            </nav>
            <p className="fe-site-footer-copy">
              © {new Date().getFullYear()} {legalEntityDisplayName()}.{" "}
              {BRAND_SPOKEN}. {BRAND_TAGLINE}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { APP_BASE, LOGIN_PATH, appPath } from "@/lib/app-base";
import { BRAND_LEGAL } from "@/lib/brand";
import { BrandLockup } from "@/app/components/BrandLockup";

type MeUser = {
  email: string;
  name: string | null;
  role?: string;
};

export function FrontendShell({
  children,
}: {
  children: ReactNode;
  /** @deprecated chrome uses the brand lockup; kept for call-site compatibility */
  siteName?: string;
}) {
  return (
    <div className="frontend-home">
      <FrontendHeader />
      <main className="frontend-main">{children}</main>
      <FrontendFooter />
    </div>
  );
}

export function FrontendHeader() {
  const [user, setUser] = useState<MeUser | null | undefined>(undefined);

  useEffect(() => {
    void fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d: { user?: MeUser | null }) => setUser(d.user ?? null))
      .catch(() => setUser(null));
  }, []);

  const isAdmin =
    user?.role === "platform_admin" || user?.role === "support";
  const appHref = isAdmin ? "/admin" : APP_BASE;

  return (
    <header className="frontend-header">
      <Link href="/" className="frontend-brand" aria-label="NuraHelp home">
        <BrandLockup showHelp />
      </Link>
      <nav className="frontend-nav">
        <div className="frontend-nav-links">
          <Link href="/emdr">EMDR</Link>
          <Link href="/resources">Resources</Link>
          <Link href="/therapists">Therapists</Link>
        </div>
        {user === undefined ? (
          <span className="frontend-nav-muted">…</span>
        ) : user ? (
          <Link href={appHref} className="frontend-btn-primary">
            Open app
          </Link>
        ) : (
          <>
            <Link href={appPath("/create-account")} className="frontend-btn-ghost">
              Create account
            </Link>
            <Link href={LOGIN_PATH} className="frontend-btn-primary">
              Sign in
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}

export function FrontendFooter() {
  return (
    <footer className="frontend-footer">
      <p className="frontend-footer-copy">
        © {new Date().getFullYear()} {BRAND_LEGAL}
      </p>
      <nav className="frontend-footer-nav">
        <Link href="/emdr">EMDR</Link>
        <Link href="/therapy">Therapy</Link>
        <Link href="/resources">Resources</Link>
        <Link href="/therapists">Therapists</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </nav>
    </footer>
  );
}

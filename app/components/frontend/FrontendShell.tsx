"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { APP_BASE, LOGIN_PATH, appPath } from "@/lib/app-base";

type MeUser = {
  email: string;
  name: string | null;
  role?: string;
};

export function FrontendShell({
  children,
  siteName = "NuraHelp AI",
}: {
  children: ReactNode;
  siteName?: string;
}) {
  return (
    <div className="frontend-home">
      <FrontendHeader siteName={siteName} />
      <main className="frontend-main">{children}</main>
      <FrontendFooter siteName={siteName} />
    </div>
  );
}

export function FrontendHeader({ siteName }: { siteName: string }) {
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
      <Link href="/" className="frontend-brand">
        {siteName}
      </Link>
      <nav className="frontend-nav">
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

export function FrontendFooter({ siteName }: { siteName: string }) {
  return (
    <footer className="frontend-footer">
      <p className="frontend-footer-copy">
        © {new Date().getFullYear()} {siteName}
      </p>
      <nav className="frontend-footer-nav">
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </nav>
    </footer>
  );
}

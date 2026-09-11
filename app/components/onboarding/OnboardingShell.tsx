"use client";

import type { ReactNode } from "react";
import { BrandLockup } from "@/app/components/BrandLockup";
import "@/app/components/frontend/frontend-fonts.css";
import "@/app/components/frontend/frontend-buttons.css";
import "./onboarding-shell.css";

type OnboardingShellProps = {
  kicker?: string;
  title: string;
  lead?: string;
  children: ReactNode;
  footer?: ReactNode;
};

/**
 * Marketing-aligned shell for /app/onboarding (Curevo / frontend-home type).
 * Keeps auth pages on AuthShell so login/create-account stay product chrome.
 */
export function OnboardingShell({
  kicker,
  title,
  lead,
  children,
  footer,
}: OnboardingShellProps) {
  return (
    <div className="frontend-home ob-shell">
      <div className="ob-shell-inner">
        <header className="ob-shell-header">
          <p className="ob-shell-brand">
            <BrandLockup href="/" tone="color" />
          </p>
          {kicker ? <p className="ob-kicker">{kicker}</p> : null}
          <h1 className="ob-title">{title}</h1>
          {lead ? <p className="ob-lead">{lead}</p> : null}
        </header>

        <div className="ob-panel">{children}</div>

        {footer ? <div className="ob-shell-footer">{footer}</div> : null}
      </div>
    </div>
  );
}

"use client";

import type { ReactNode } from "react";
import { HelpChatWidget } from "@/app/components/HelpChatWidget";
import { FrontendBackToTop } from "@/app/components/frontend/FrontendBackToTop";
import { FrontendFooter } from "@/app/components/frontend/FrontendFooter";
import { FrontendHeader } from "@/app/components/frontend/FrontendHeader";
import { FrontendPreloader } from "@/app/components/frontend/FrontendPreloader";
import "./frontend-fonts.css";
import "./frontend-buttons.css";
import "./frontend-help.css";

export function FrontendShell({
  children,
  wide = false,
}: {
  children: ReactNode;
  /** Full-width main (home landing). */
  wide?: boolean;
  /** @deprecated chrome uses the brand lockup; kept for call-site compatibility */
  siteName?: string;
}) {
  return (
    <div className={`frontend-home${wide ? " frontend-home-landing" : ""}`}>
      {wide ? <FrontendPreloader /> : null}
      <FrontendHeader overlay={wide} />
      <main
        className={wide ? "frontend-main frontend-main-wide" : "frontend-main"}
      >
        {children}
      </main>
      <FrontendFooter />
      <FrontendBackToTop />
      {/* Desktop-only FAB via frontend-help.css (hidden ≤768px) */}
      <HelpChatWidget showFab />
    </div>
  );
}

export { FrontendFooter };

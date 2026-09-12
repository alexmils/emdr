"use client";

import { useEffect } from "react";
import { openHelpChat } from "@/app/components/HelpChatWidget";

/**
 * Termly HTML cannot mount React buttons. Prepared markup uses
 * `data-open-help` controls; this listener opens the shared Need help drawer.
 */
export function LegalOpenHelp() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      const btn = t.closest("[data-open-help]");
      if (!btn) return;
      e.preventDefault();
      openHelpChat();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}

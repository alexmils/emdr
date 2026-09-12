"use client";

import { useEffect, useId, useRef, useState } from "react";
import { BRAND_SPOKEN } from "@/lib/brand";

/**
 * Always-available crisis resources in session UI (separate from product Help).
 */
export function CrisisHelpButton() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  return (
    <div className="crisis-help">
      <button
        ref={btnRef}
        type="button"
        className="crisis-help-btn"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        I need help now
      </button>
      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          className="crisis-help-panel"
          role="dialog"
          aria-label="Crisis resources"
        >
          <p className="crisis-help-lead">
            {BRAND_SPOKEN} is not crisis care and does not provide emergency
            services.
          </p>
          <ul className="crisis-help-list">
            <li>
              <strong>US — 988</strong>
              <span> Suicide &amp; Crisis Lifeline: call or text 988</span>
            </li>
            <li>
              <strong>Emergency</strong>
              <span> Call your local emergency number</span>
            </li>
            <li>
              <strong>Chat</strong>
              <span>
                {" "}
                <a
                  href="https://988lifeline.org"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  988lifeline.org
                </a>
              </span>
            </li>
          </ul>
          <button
            type="button"
            className="crisis-help-close"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** Persistent, non-dismissible product positioning in session chrome. */
export function SessionNotTherapyStrip() {
  return (
    <p className="session-not-therapy" role="note">
      Self-help support — not a licensed therapist · not emergency care
    </p>
  );
}

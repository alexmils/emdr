"use client";

import { useCallback, useEffect, useState } from "react";
import type { SessionKind } from "@/lib/types";
import { useApp } from "./AppProvider";

type Choice = Exclude<SessionKind, "pending">;

const CHOICES: {
  id: Choice;
  title: string;
  description: string;
  keyHint: string;
}[] = [
  {
    id: "guided",
    title: "Guided session",
    description:
      "An AI guide walks you through the EMDR phases, checks in after each set, and tracks SUDs.",
    keyHint: "1",
  },
  {
    id: "free",
    title: "Free session",
    description:
      "Just the moving ball. You start, stop, and adjust it yourself.",
    keyHint: "2",
  },
];

export function SessionStartScreen() {
  const { chooseSessionMode, entitlement, openUpgradeModal } = useApp();
  const [focused, setFocused] = useState<Choice>("guided");
  const [busy, setBusy] = useState(false);
  const [hintVisible, setHintVisible] = useState(true);

  const guidedBlocked =
    entitlement?.isTrialLimited &&
    entitlement.guidedRemaining !== undefined &&
    entitlement.guidedRemaining <= 0;

  const blsBlocked =
    entitlement?.isTrialLimited &&
    entitlement.blsSecondsRemaining !== undefined &&
    entitlement.blsSecondsRemaining <= 0;

  const pick = useCallback(
    async (kind: Choice) => {
      if (busy) return;
      if (kind === "guided" && guidedBlocked) {
        openUpgradeModal("trial_limit_reached");
        return;
      }
      if (kind === "free" && blsBlocked) {
        openUpgradeModal("bls_limit_reached");
        return;
      }
      setBusy(true);
      try {
        await chooseSessionMode(kind);
      } finally {
        setBusy(false);
      }
    },
    [busy, chooseSessionMode, guidedBlocked, blsBlocked, openUpgradeModal]
  );

  useEffect(() => {
    const t = window.setTimeout(() => setHintVisible(false), 2500);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (busy) return;
      if (e.key === "1") {
        e.preventDefault();
        void pick("guided");
        return;
      }
      if (e.key === "2") {
        e.preventDefault();
        void pick("free");
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        setFocused((f) => (f === "guided" ? "free" : "guided"));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        void pick(focused);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, focused, pick]);

  return (
    <div className="session-start">
      <div className="session-start-inner">
        <h2 className="session-start-title">Start a session</h2>
        <p className="session-start-subtitle">
          Choose how you want to work. This choice stays for this session.
        </p>
        {entitlement?.isTrialLimited && (
          <p className="session-start-trial">
            Trial: {Math.max(0, entitlement.guidedRemaining)} guided left ·{" "}
            {Math.floor(Math.max(0, entitlement.blsSecondsRemaining) / 60)} min
            Free left
            {(guidedBlocked || blsBlocked) && (
              <>
                {" "}
                ·{" "}
                <button
                  type="button"
                  className="text-[var(--accent)] underline"
                  onClick={() =>
                    openUpgradeModal(
                      guidedBlocked ? "trial_limit_reached" : "bls_limit_reached"
                    )
                  }
                >
                  Upgrade
                </button>
              </>
            )}
          </p>
        )}
        <div
          className="session-start-cards"
          role="listbox"
          aria-label="Session type"
        >
          {CHOICES.map((c) => {
            const blocked =
              (c.id === "guided" && guidedBlocked) ||
              (c.id === "free" && blsBlocked);
            return (
              <button
                key={c.id}
                type="button"
                role="option"
                aria-selected={focused === c.id}
                disabled={busy}
                className={`session-start-card ${focused === c.id ? "session-start-card--focused" : ""} ${blocked ? "session-start-card--blocked" : ""}`}
                onMouseEnter={() => setFocused(c.id)}
                onFocus={() => setFocused(c.id)}
                onClick={() => void pick(c.id)}
              >
                <span className="session-start-card-key">{c.keyHint}</span>
                <span className="session-start-card-title">{c.title}</span>
                <span className="session-start-card-desc">
                  {blocked
                    ? c.id === "guided"
                      ? "Trial guided sessions used — upgrade to continue."
                      : "Trial Free session time used — upgrade to continue."
                    : c.description}
                </span>
              </button>
            );
          })}
        </div>
        <p
          className={`session-start-hint${hintVisible ? "" : " session-start-hint--gone"}`}
          aria-hidden={!hintVisible}
        >
          Press 1 or 2 · arrows to move · Enter to confirm
        </p>
      </div>
    </div>
  );
}

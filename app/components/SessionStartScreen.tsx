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
      "Just bilateral stimulation. You start, stop, and adjust the ball yourself.",
    keyHint: "2",
  },
];

export function SessionStartScreen() {
  const { chooseSessionMode } = useApp();
  const [focused, setFocused] = useState<Choice>("guided");
  const [busy, setBusy] = useState(false);

  const pick = useCallback(
    async (kind: Choice) => {
      if (busy) return;
      setBusy(true);
      try {
        await chooseSessionMode(kind);
      } finally {
        setBusy(false);
      }
    },
    [busy, chooseSessionMode]
  );

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
        <div
          className="session-start-cards"
          role="listbox"
          aria-label="Session type"
        >
          {CHOICES.map((c) => (
            <button
              key={c.id}
              type="button"
              role="option"
              aria-selected={focused === c.id}
              disabled={busy}
              className={`session-start-card ${focused === c.id ? "session-start-card--focused" : ""}`}
              onMouseEnter={() => setFocused(c.id)}
              onFocus={() => setFocused(c.id)}
              onClick={() => void pick(c.id)}
            >
              <span className="session-start-card-key">{c.keyHint}</span>
              <span className="session-start-card-title">{c.title}</span>
              <span className="session-start-card-desc">{c.description}</span>
            </button>
          ))}
        </div>
        <p className="session-start-hint">
          Press 1 or 2 · arrows to move · Enter to confirm
        </p>
      </div>
    </div>
  );
}

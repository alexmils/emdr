"use client";

import { useEffect, useRef, useState } from "react";
import { useApp } from "./AppProvider";

export function SessionDescription({
  threadId,
  description,
}: {
  threadId: string;
  description?: string;
}) {
  const { updateThreadLocal } = useApp();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(description ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(description ?? "");
  }, [description, threadId]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const save = async () => {
    const next = draft.trim();
    setEditing(false);
    if (next === (description ?? "").trim()) return;
    await updateThreadLocal(threadId, {
      description: next,
    });
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="workspace-description-input"
        value={draft}
        placeholder="Add a description…"
        maxLength={160}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => void save()}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void save();
          }
          if (e.key === "Escape") {
            setDraft(description ?? "");
            setEditing(false);
          }
        }}
        aria-label="Session description"
      />
    );
  }

  return (
    <button
      type="button"
      className={`workspace-hint workspace-description ${description ? "" : "workspace-description--empty"}`}
      onClick={() => setEditing(true)}
    >
      {description?.trim() || "Add a description…"}
    </button>
  );
}

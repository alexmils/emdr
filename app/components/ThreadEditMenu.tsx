"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "./AppProvider";
import { AppleToggle } from "./AppleToggle";

export function ThreadEditMenu({
  threadId,
  onClose,
}: {
  threadId: string;
  onClose: () => void;
}) {
  const {
    threads,
    memorySets,
    threadMemorySets,
    updateThreadLocal,
    setThreadMemorySet,
    selectThread,
    refreshSettings,
  } = useApp();
  const thread = threads.find((t) => t.id === threadId);
  const [title, setTitle] = useState(thread?.title ?? "");
  const [description, setDescription] = useState(thread?.description ?? "");
  const [newSetName, setNewSetName] = useState("");
  const [creatingSet, setCreatingSet] = useState(false);

  useEffect(() => {
    void selectThread(threadId);
  }, [threadId, selectThread]);

  useEffect(() => {
    setTitle(thread?.title ?? "");
    setDescription(thread?.description ?? "");
  }, [thread?.title, thread?.description, threadId]);

  if (!thread) return null;

  const isSetEnabled = (setId: string) =>
    threadMemorySets.some((t) => t.setId === setId && t.enabled);

  const createSet = async () => {
    const name = newSetName.trim();
    if (!name || creatingSet) return;
    setCreatingSet(true);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_set", name }),
      });
      setNewSetName("");
      await refreshSettings();
      await selectThread(threadId);
    } finally {
      setCreatingSet(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="apple-sheet w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-[17px] font-semibold tracking-[-0.02em]">
          Edit session
        </h2>
        <label className="mb-4 block">
          <span className="mb-2 block text-[12px] font-medium text-[var(--text-secondary)]">
            Title
          </span>
          <input
            className="field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="mb-4 block">
          <span className="mb-2 block text-[12px] font-medium text-[var(--text-secondary)]">
            Description
          </span>
          <input
            className="field"
            value={description}
            placeholder="Optional note for this session"
            maxLength={160}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[13px] font-medium">Memory sets</p>
          <Link
            href="/settings?tab=memory"
            className="text-[12px] font-medium text-[var(--accent)] hover:underline"
            onClick={onClose}
          >
            Open Settings
          </Link>
        </div>
        <div className="settings-group mb-3 max-h-44 overflow-y-auto">
          {memorySets.length === 0 && (
            <p className="settings-row text-[13px] text-[var(--text-secondary)]">
              No memory sets yet. Create one below, or manage memories in
              Settings.
            </p>
          )}
          {memorySets.map((set) => (
            <div
              key={set.id}
              className="settings-row settings-toggle-row items-center"
            >
              <span className="text-[13px]">{set.name}</span>
              <AppleToggle
                label={`Enable ${set.name}`}
                checked={isSetEnabled(set.id)}
                onChange={(enabled) => void setThreadMemorySet(set.id, enabled)}
              />
            </div>
          ))}
        </div>
        <div className="mb-5 flex gap-2">
          <input
            className="field flex-1"
            value={newSetName}
            placeholder="New set name"
            maxLength={80}
            onChange={(e) => setNewSetName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void createSet();
              }
            }}
          />
          <button
            type="button"
            className="btn-secondary shrink-0"
            disabled={!newSetName.trim() || creatingSet}
            onClick={() => void createSet()}
          >
            {creatingSet ? "Adding…" : "Add set"}
          </button>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              void updateThreadLocal(threadId, {
                title,
                description: description.trim(),
              });
              onClose();
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

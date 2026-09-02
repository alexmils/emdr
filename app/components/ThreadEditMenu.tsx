"use client";

import { useEffect, useState } from "react";
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
  } = useApp();
  const thread = threads.find((t) => t.id === threadId);
  const [title, setTitle] = useState(thread?.title ?? "");

  useEffect(() => {
    void selectThread(threadId);
  }, [threadId, selectThread]);

  if (!thread) return null;

  const isSetEnabled = (setId: string) =>
    threadMemorySets.some((t) => t.setId === setId && t.enabled);

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
        <p className="mb-2 text-[13px] font-medium">Memory sets</p>
        <div className="settings-group mb-5 max-h-44 overflow-y-auto">
          {memorySets.length === 0 && (
            <p className="settings-row text-[13px] text-[var(--text-secondary)]">
              No memory sets yet. Create them in Settings.
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
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              void updateThreadLocal(threadId, { title });
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

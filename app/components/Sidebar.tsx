"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Plus } from "lucide-react";
import { useApp } from "./AppProvider";
import { ThreadEditMenu } from "./ThreadEditMenu";

export function Sidebar() {
  const { threads, activeThreadId, selectThread, createThread } = useApp();
  const [accountOpen, setAccountOpen] = useState(false);
  const [editThreadId, setEditThreadId] = useState<string | null>(null);

  return (
    <aside className="glass-sidebar flex h-full w-[260px] shrink-0 flex-col">
      <div className="px-4 pb-3 pt-5">
        <p className="text-headline">EMDR Guide</p>
        <p className="text-caption mt-0.5">Sessions</p>
      </div>

      <div className="px-3 pb-2">
        <button
          type="button"
          onClick={() => void createThread()}
          className="btn-primary flex w-full"
        >
          <Plus size={16} strokeWidth={2.25} />
          New session
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-1">
        {threads.length === 0 && (
          <p className="text-caption px-3 py-6 text-center leading-relaxed">
            No sessions yet
          </p>
        )}
        {threads.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => void selectThread(t.id)}
            onContextMenu={(e) => {
              e.preventDefault();
              setEditThreadId(t.id);
            }}
            className={`row-item mb-0.5 ${activeThreadId === t.id ? "row-active" : ""}`}
          >
            {t.title}
          </button>
        ))}
      </nav>

      <div className="relative border-t border-[var(--separator-opaque)] p-3">
        <button
          type="button"
          onClick={() => setAccountOpen((o) => !o)}
          className="btn-ghost flex w-full items-center justify-between"
        >
          <span className="text-subhead font-medium">Account</span>
          <ChevronDown
            size={15}
            className={`text-[var(--text-secondary)] transition ${accountOpen ? "rotate-180" : ""}`}
          />
        </button>
        {accountOpen && (
          <div className="apple-sheet absolute bottom-full left-3 right-3 mb-2 overflow-hidden py-1">
            <Link href="/settings" className="btn-ghost block w-full text-left">
              Settings
            </Link>
            <Link href="/billing" className="btn-ghost block w-full text-left">
              Billing
            </Link>
            <button
              type="button"
              className="btn-ghost block w-full text-left text-[var(--destructive)]"
              onClick={() => alert("Logged out (demo)")}
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {editThreadId && (
        <ThreadEditMenu
          threadId={editThreadId}
          onClose={() => setEditThreadId(null)}
        />
      )}
    </aside>
  );
}

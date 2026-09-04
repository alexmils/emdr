"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus } from "lucide-react";
import { useApp } from "./AppProvider";
import { ThreadEditMenu } from "./ThreadEditMenu";
import { Avatar } from "./Avatar";
import { displayNameFor, useCurrentUser } from "./useCurrentUser";

export function Sidebar() {
  const router = useRouter();
  const { threads, activeThreadId, selectThread, createThread } = useApp();
  const { user } = useCurrentUser();
  const [accountOpen, setAccountOpen] = useState(false);
  const [editThreadId, setEditThreadId] = useState<string | null>(null);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const label = displayNameFor(user);

  return (
    <aside className="app-sidebar flex h-full w-[260px] shrink-0 flex-col">
      <div className="px-4 pb-3 pt-4">
        <p className="text-sidebar-title">EMDR Guide</p>
      </div>

      <div className="px-3 pb-2">
        <button
          type="button"
          onClick={() => void createThread()}
          className="btn-primary flex w-full !min-h-[36px] !text-[13px]"
        >
          <Plus size={15} strokeWidth={2} />
          New chat
        </button>
      </div>

      <p className="text-sidebar-section px-4 pb-1 pt-2">Recent</p>

      <nav className="flex-1 overflow-y-auto px-2 py-1">
        {threads.length === 0 && (
          <p className="text-sidebar-muted px-3 py-4 text-center text-[13px]">
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
            className={`sidebar-row ${activeThreadId === t.id ? "sidebar-row-active" : ""}`}
          >
            {t.title}
          </button>
        ))}
      </nav>

      <div className="relative border-t border-[var(--sidebar-border)] p-2">
        <button
          type="button"
          onClick={() => setAccountOpen((o) => !o)}
          className="sidebar-account-btn"
        >
          <span className="sidebar-account-identity">
            <Avatar
              src={user?.avatarUrl}
              alt={label}
              fallback={label}
              className="avatar-sm"
            />
            <span className="min-w-0 truncate text-[13px]">
              {label}
              {user?.role === "platform_admin" && (
                <span className="ml-1 text-[var(--accent)]">· Admin</span>
              )}
              {user?.role === "support" && (
                <span className="ml-1 text-[var(--accent)]">· Support</span>
              )}
            </span>
          </span>
          <ChevronDown
            size={14}
            className={`shrink-0 opacity-60 transition ${accountOpen ? "rotate-180" : ""}`}
          />
        </button>
        {accountOpen && (
          <div className="dropdown-menu absolute bottom-full left-2 right-2 mb-1 py-1">
            {(user?.role === "platform_admin" || user?.role === "support") && (
              <Link href="/admin" className="dropdown-item">
                Admin dashboard
              </Link>
            )}
            <Link href="/settings?tab=profile" className="dropdown-item">
              Settings
            </Link>
            <Link href="/billing" className="dropdown-item">
              Billing
            </Link>
            <button
              type="button"
              className="dropdown-item w-full text-left text-[var(--destructive)]"
              onClick={() => void logout()}
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

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, ChevronDown, Home, Plus, X } from "lucide-react";
import { useApp } from "./AppProvider";
import { ThreadEditMenu } from "./ThreadEditMenu";
import { Avatar } from "./Avatar";
import { displayNameFor, useCurrentUser } from "./useCurrentUser";
import { useSidebarNav } from "./SidebarNavContext";
import { APP_BASE, appPath } from "@/lib/app-base";

const SIDEBAR_NAV = [
  { href: APP_BASE, label: "Home", icon: Home, exact: true },
  { href: appPath("/resources"), label: "Resources", icon: BookOpen, exact: false },
] as const;

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    threads,
    activeThreadId,
    selectThread,
    createThread,
    entitlement,
    openUpgradeModal,
  } = useApp();
  const { user } = useCurrentUser();
  const { closeSidebar } = useSidebarNav();
  const [accountOpen, setAccountOpen] = useState(false);
  const [editThreadId, setEditThreadId] = useState<string | null>(null);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/app/login");
    router.refresh();
  };

  const label = displayNameFor(user);

  const onSelectThread = (id: string) => {
    void selectThread(id);
    closeSidebar();
  };

  const onNewChat = () => {
    void createThread();
    closeSidebar();
  };

  return (
    <aside className="app-sidebar flex h-full w-[260px] shrink-0 flex-col">
      <div className="app-sidebar-top">
        <p className="text-sidebar-title">NuraHelp AI</p>
        <button
          type="button"
          className="app-sidebar-close"
          aria-label="Close sidebar"
          onClick={closeSidebar}
        >
          <X size={18} strokeWidth={2} />
        </button>
      </div>

      <div className="px-3 pb-2">
        <button
          type="button"
          onClick={onNewChat}
          className="btn-primary flex w-full !min-h-[36px] !text-[13px]"
        >
          <Plus size={15} strokeWidth={2} />
          New chat
        </button>
        {entitlement?.isTrialLimited && (
          <button
            type="button"
            className="sidebar-trial-chip mt-2 w-full text-left"
            onClick={() => {
              openUpgradeModal("generic");
              closeSidebar();
            }}
          >
            Trial · {Math.max(0, entitlement.guidedRemaining)} guided ·{" "}
            {Math.floor(Math.max(0, entitlement.blsSecondsRemaining) / 60)}m BLS
          </button>
        )}
      </div>

      <nav className="sidebar-primary-nav px-2 pb-1" aria-label="Main">
        {SIDEBAR_NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={closeSidebar}
              className={`sidebar-nav-link ${active ? "sidebar-nav-link-active" : ""}`}
            >
              <Icon size={16} strokeWidth={2} aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>

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
            onClick={() => onSelectThread(t.id)}
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
              <Link
                href="/admin"
                className="dropdown-item"
                onClick={closeSidebar}
              >
                Admin dashboard
              </Link>
            )}
            <Link
              href="/app/settings?tab=profile"
              className="dropdown-item"
              onClick={closeSidebar}
            >
              Settings
            </Link>
            <Link
              href="/app/billing"
              className="dropdown-item"
              onClick={closeSidebar}
            >
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

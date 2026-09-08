"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { PanelLeft } from "lucide-react";

type SidebarNavState = {
  open: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
};

const SidebarNavContext = createContext<SidebarNavState | null>(null);

export function SidebarNavProvider({
  children,
  forceClosed = false,
}: {
  children: ReactNode;
  /** e.g. BLS immersive — keep drawer shut */
  forceClosed?: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (forceClosed) setOpen(false);
  }, [forceClosed]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const openSidebar = useCallback(() => setOpen(true), []);
  const closeSidebar = useCallback(() => setOpen(false), []);
  const toggleSidebar = useCallback(() => setOpen((v) => !v), []);

  const value = useMemo(
    () => ({ open, openSidebar, closeSidebar, toggleSidebar }),
    [open, openSidebar, closeSidebar, toggleSidebar]
  );

  return (
    <SidebarNavContext.Provider value={value}>
      {children}
    </SidebarNavContext.Provider>
  );
}

export function useSidebarNav() {
  const ctx = useContext(SidebarNavContext);
  if (!ctx) {
    throw new Error("useSidebarNav must be used within SidebarNavProvider");
  }
  return ctx;
}

/** Optional when a subtree may render outside the shell (tests). */
export function useSidebarNavOptional() {
  return useContext(SidebarNavContext);
}

export function WorkspaceMenuButton() {
  const nav = useSidebarNavOptional();
  if (!nav) return null;

  return (
    <button
      type="button"
      className="workspace-menu-btn"
      aria-label="Open sidebar"
      aria-expanded={nav.open}
      onClick={nav.openSidebar}
    >
      <PanelLeft size={20} strokeWidth={2} />
    </button>
  );
}

export function SidebarBackdrop() {
  const { open, closeSidebar } = useSidebarNav();
  return (
    <button
      type="button"
      className={`app-sidebar-backdrop ${open ? "is-visible" : ""}`}
      aria-label="Close sidebar"
      tabIndex={open ? 0 : -1}
      onClick={closeSidebar}
    />
  );
}

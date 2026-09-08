"use client";

import { useApp } from "./AppProvider";
import { Sidebar } from "./Sidebar";
import { SessionWorkspace } from "./SessionWorkspace";
import {
  SidebarBackdrop,
  SidebarNavProvider,
  useSidebarNav,
} from "./SidebarNavContext";

function AppShellFrame() {
  const { sessionMode } = useApp();
  const { open } = useSidebarNav();
  const immersive = sessionMode === "running";

  return (
    <div
      className={`app-shell flex h-screen overflow-hidden ${immersive ? "session-immersive" : ""} ${open ? "sidebar-drawer-open" : ""}`}
    >
      <SidebarBackdrop />
      <Sidebar />
      <SessionWorkspace />
    </div>
  );
}

export function AppShell() {
  const { sessionMode } = useApp();
  const immersive = sessionMode === "running";

  return (
    <SidebarNavProvider forceClosed={immersive}>
      <AppShellFrame />
    </SidebarNavProvider>
  );
}

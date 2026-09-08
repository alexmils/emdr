"use client";

import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { SidebarBackdrop } from "./SidebarNavContext";

export function AppConsoleFrame({
  children,
  immersive = false,
  drawerOpen = false,
}: {
  children: ReactNode;
  immersive?: boolean;
  drawerOpen?: boolean;
}) {
  return (
    <div
      className={`app-shell flex h-dvh max-h-dvh overflow-hidden ${immersive ? "session-immersive" : ""} ${drawerOpen ? "sidebar-drawer-open" : ""}`}
    >
      <SidebarBackdrop />
      <Sidebar />
      {children}
    </div>
  );
}

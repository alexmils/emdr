"use client";

import { useApp } from "./AppProvider";
import { Sidebar } from "./Sidebar";
import { SessionWorkspace } from "./SessionWorkspace";

export function AppShell() {
  const { sessionMode } = useApp();
  const immersive = sessionMode === "running";

  return (
    <div
      className={`app-shell flex h-screen overflow-hidden ${immersive ? "session-immersive" : ""}`}
    >
      <Sidebar />
      <SessionWorkspace />
    </div>
  );
}

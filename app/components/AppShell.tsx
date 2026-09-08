"use client";

import { useApp } from "./AppProvider";
import { AppConsoleFrame } from "./AppConsoleFrame";
import { SessionWorkspace } from "./SessionWorkspace";
import {
  SidebarNavProvider,
  useSidebarNav,
} from "./SidebarNavContext";

function AppShellFrame() {
  const { sessionMode } = useApp();
  const { open } = useSidebarNav();
  const immersive = sessionMode === "running";

  return (
    <AppConsoleFrame immersive={immersive} drawerOpen={open}>
      <SessionWorkspace />
    </AppConsoleFrame>
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

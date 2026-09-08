"use client";

import { AppProvider } from "@/app/components/AppProvider";
import { AppConsoleFrame } from "@/app/components/AppConsoleFrame";
import { ResourcesLibrary } from "@/app/components/ResourcesView";
import {
  SidebarNavProvider,
  useSidebarNav,
} from "@/app/components/SidebarNavContext";

export default function ResourcesPage() {
  return (
    <AppProvider>
      <SidebarNavProvider>
        <ResourcesShell />
      </SidebarNavProvider>
    </AppProvider>
  );
}

function ResourcesShell() {
  const { open } = useSidebarNav();
  return (
    <AppConsoleFrame drawerOpen={open}>
      <ResourcesLibrary />
    </AppConsoleFrame>
  );
}

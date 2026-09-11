"use client";

import { AppConsoleFrame } from "@/app/components/AppConsoleFrame";
import { ResourceArticleView } from "@/app/components/ResourcesView";
import { useSidebarNav } from "@/app/components/SidebarNavContext";
import type { ResourceItem } from "@/lib/resources";

export function ResourceArticleShell({ item }: { item: ResourceItem }) {
  const { open } = useSidebarNav();
  return (
    <AppConsoleFrame drawerOpen={open}>
      <ResourceArticleView item={item} />
    </AppConsoleFrame>
  );
}

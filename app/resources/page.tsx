import { FrontendShell } from "@/app/components/frontend/FrontendShell";
import { ResourcesHub } from "@/app/components/frontend/ResourcesHub";
import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/lib/public-page-cache";
import { buildCachedPageMetadata } from "@/lib/site-seo-cache";
import type { Metadata } from "next";

export const revalidate = PUBLIC_PAGE_REVALIDATE_SECONDS;

export async function generateMetadata(): Promise<Metadata> {
  return buildCachedPageMetadata("resources");
}

export default function ResourcesPage() {
  return (
    <FrontendShell>
      <ResourcesHub />
    </FrontendShell>
  );
}

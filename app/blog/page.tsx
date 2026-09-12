import { BlogIndex } from "@/app/components/frontend/BlogIndex";
import { FrontendShell } from "@/app/components/frontend/FrontendShell";
import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/lib/public-page-cache";
import { buildCachedPageMetadata } from "@/lib/site-seo-cache";
import type { Metadata } from "next";

export const revalidate = PUBLIC_PAGE_REVALIDATE_SECONDS;

export async function generateMetadata(): Promise<Metadata> {
  return buildCachedPageMetadata("blog");
}

export default function BlogPage() {
  return (
    <FrontendShell>
      <BlogIndex />
    </FrontendShell>
  );
}

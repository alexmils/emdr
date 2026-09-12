import { BlogIndex } from "@/app/components/frontend/BlogIndex";
import { FrontendShell } from "@/app/components/frontend/FrontendShell";
import { buildCachedPageMetadata } from "@/lib/site-seo-cache";
import type { Metadata } from "next";

export const revalidate = 3600; // ISR: static HTML, revalidated hourly

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

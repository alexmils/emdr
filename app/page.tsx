import { HomeLanding } from "@/app/components/frontend/HomeLanding";
import { FrontendShell } from "@/app/components/frontend/FrontendShell";
import { getLandingBlogPosts } from "@/lib/landing-blog-server";
import { buildCachedPageMetadata } from "@/lib/site-seo-cache";
import type { Metadata } from "next";

export const revalidate = 3600; // ISR: static HTML, revalidated hourly

export async function generateMetadata(): Promise<Metadata> {
  return buildCachedPageMetadata("home");
}

export default async function HomePage() {
  const blogPosts = await getLandingBlogPosts(3);

  return (
    <FrontendShell wide>
      <HomeLanding blogPosts={blogPosts} />
    </FrontendShell>
  );
}

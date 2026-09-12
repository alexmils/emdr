import { HomeLanding } from "@/app/components/frontend/HomeLanding";
import { FrontendShell } from "@/app/components/frontend/FrontendShell";
import { JsonLd } from "@/app/components/frontend/JsonLd";
import { getLandingBlogPosts } from "@/lib/landing-blog-server";
import { buildHomeJsonLd } from "@/lib/json-ld";
import { buildCachedPageMetadata } from "@/lib/site-seo-cache";
import type { Metadata } from "next";

export const revalidate = 3600; // PUBLIC_PAGE_REVALIDATE_SECONDS

export async function generateMetadata(): Promise<Metadata> {
  return buildCachedPageMetadata("home");
}

export default async function HomePage() {
  const blogPosts = await getLandingBlogPosts(3);

  return (
    <FrontendShell wide>
      <JsonLd data={buildHomeJsonLd()} />
      <HomeLanding blogPosts={blogPosts} />
    </FrontendShell>
  );
}

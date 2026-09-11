import { HomeLanding } from "@/app/components/frontend/HomeLanding";
import { FrontendShell } from "@/app/components/frontend/FrontendShell";
import { getLandingBlogPosts } from "@/lib/landing-blog-server";
import { buildPageMetadata } from "@/lib/site-seo";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("home");
}

export default async function HomePage() {
  const blogPosts = await getLandingBlogPosts(3);

  return (
    <FrontendShell wide>
      <HomeLanding blogPosts={blogPosts} />
    </FrontendShell>
  );
}

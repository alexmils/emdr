import { HomeLanding } from "@/app/components/frontend/HomeLanding";
import { FrontendShell } from "@/app/components/frontend/FrontendShell";
import { BRAND_DESCRIPTION, BRAND_TITLE } from "@/lib/brand";
import { getLandingBlogPosts } from "@/lib/landing-blog-server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: BRAND_TITLE,
  description: BRAND_DESCRIPTION,
};

export default async function HomePage() {
  const blogPosts = await getLandingBlogPosts(3);

  return (
    <FrontendShell wide>
      <HomeLanding blogPosts={blogPosts} />
    </FrontendShell>
  );
}

import { featuredClusterPosts } from "@/lib/content-cluster";
import type { LandingBlogPost } from "@/lib/landing-blog";

/** Featured public cluster posts for the home blog grid (no CMS/DB). */
export async function getLandingBlogPosts(
  limit = 3
): Promise<LandingBlogPost[]> {
  return featuredClusterPosts(limit);
}

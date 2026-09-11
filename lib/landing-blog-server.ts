import { toLandingPost, type LandingBlogPost } from "@/lib/landing-blog";
import { listPublishedResources } from "@/lib/resources-db";

/** Featured guides for the home blog grid (real `created_at` from DB). */
export async function getLandingBlogPosts(
  limit = 3
): Promise<LandingBlogPost[]> {
  try {
    let posts = await listPublishedResources({
      featuredOnly: true,
      kind: "article",
      limit,
    });
    if (posts.length < limit) {
      const more = await listPublishedResources({
        kind: "article",
        limit: limit * 2,
      });
      const seen = new Set(posts.map((p) => p.id));
      for (const p of more) {
        if (seen.has(p.id)) continue;
        posts.push(p);
        if (posts.length >= limit) break;
      }
    }
    return posts.slice(0, limit).map(toLandingPost);
  } catch {
    return [];
  }
}

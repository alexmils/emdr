import { ClusterKeepReading } from "@/app/components/frontend/ClusterKeepReading";
import { featuredClusterPosts } from "@/lib/content-cluster";

export function EmdrKeepReading() {
  const posts = featuredClusterPosts(3);

  return (
    <ClusterKeepReading
      posts={posts.map((post) => ({
        slug: post.slug,
        title: post.title,
        dek: post.summary,
        coverUrl: post.coverUrl,
        tag: post.tag,
      }))}
      indexHref="/learn"
      indexLabel="Learn EMDR"
    />
  );
}

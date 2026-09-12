import Link from "next/link";
import { featuredClusterPosts } from "@/lib/content-cluster";
import "./public-cluster.css";

export function EmdrKeepReading() {
  const posts = featuredClusterPosts(3);

  return (
    <nav className="fe-cluster-related" aria-label="Keep reading">
      <h2>Keep reading</h2>
      <ul>
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={`/blog/${post.slug}`}>{post.title}</Link>
          </li>
        ))}
        <li>
          <Link href="/resources">All public guides</Link>
        </li>
      </ul>
    </nav>
  );
}

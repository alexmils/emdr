import Link from "next/link";
import { FrontendBreadcrumbs } from "@/app/components/frontend/FrontendBreadcrumbs";
import { listClusterArticles } from "@/lib/content-cluster";
import { formatBlogDate } from "@/lib/landing-blog";
import "./public-cluster.css";

export function BlogIndex() {
  const articles = listClusterArticles();

  return (
    <div className="fe-cluster">
      <div className="fe-cluster-inner fe-cluster-inner--wide">
        <FrontendBreadcrumbs
          items={[
            { href: "/", label: "Home" },
            { label: "Blog" },
          ]}
        />
        <p className="fe-cluster-kicker">Blog</p>
        <h1>EMDR therapy, visual sets, and practice</h1>
        <p className="fe-cluster-dek">
          How the moving ball works, what to do between sessions, and when to
          stop. Every guide points back to{" "}
          <Link href="/emdr">how a Nura session is structured</Link>. Topic
          groups live on <Link href="/resources">Resources</Link>.
        </p>

        <ul className="fe-cluster-list">
          {articles.map((article) => (
            <li key={article.slug}>
              <Link href={`/blog/${article.slug}`}>
                <span className="fe-cluster-list-title">{article.title}</span>
                <span className="fe-cluster-list-dek">
                  {formatBlogDate(article.publishedAt)
                    ? `${formatBlogDate(article.publishedAt)} · `
                    : ""}
                  {article.dek}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

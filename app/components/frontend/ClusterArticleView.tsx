import Link from "next/link";
import { FrontendBreadcrumbs } from "@/app/components/frontend/FrontendBreadcrumbs";
import { BRAND_SPOKEN } from "@/lib/brand";
import {
  relatedClusterArticles,
  type ClusterArticle,
} from "@/lib/content-cluster";
import { formatBlogDate } from "@/lib/landing-blog";
import "./public-cluster.css";

export function ClusterArticleView({ article }: { article: ClusterArticle }) {
  const related = relatedClusterArticles(article);
  const date = formatBlogDate(article.publishedAt);

  return (
    <article className="fe-cluster">
      <div className="fe-cluster-inner">
        <FrontendBreadcrumbs
          items={[
            { href: "/", label: "Home" },
            { href: "/blog", label: "Blog" },
            { label: article.title },
          ]}
        />
        <p className="fe-cluster-kicker">{article.kicker}</p>
        <h1>{article.title}</h1>
        <p className="fe-cluster-dek">{article.dek}</p>
        {date ? (
          <p className="fe-cluster-meta">
            <time dateTime={article.publishedAt}>{date}</time>
            {" · "}
            {BRAND_SPOKEN} editorial
            {" · "}
            <Link href="/editorial">How we write</Link>
          </p>
        ) : null}

        <div className="fe-cluster-body">
          {article.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((p) => (
                <p key={p.slice(0, 48)}>{p}</p>
              ))}
            </section>
          ))}
        </div>

        <p className="fe-cluster-emdr">
          In the app:{" "}
          <Link href="/emdr">{article.emdrAnchor}</Link>.
        </p>

        <p className="fe-cluster-note">
          {BRAND_SPOKEN} is self-help software — not a licensed therapist,
          not emergency care, and not a medical device.
        </p>

        {related.length ? (
          <nav className="fe-cluster-related" aria-label="Related guides">
            <h2>Keep reading</h2>
            <ul>
              {related.map((item) => (
                <li key={item.slug}>
                  <Link href={`/blog/${item.slug}`}>{item.title}</Link>
                </li>
              ))}
              <li>
                <Link href="/resources">All public guides</Link>
              </li>
            </ul>
          </nav>
        ) : null}
      </div>
    </article>
  );
}

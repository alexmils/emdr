import Link from "next/link";
import { FrontendBreadcrumbs } from "@/app/components/frontend/FrontendBreadcrumbs";
import { ClusterKeepReading } from "@/app/components/frontend/ClusterKeepReading";
import { BRAND_SPOKEN } from "@/lib/brand";
import {
  CLUSTER_TOPIC_LABEL,
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
      </div>

      {related.length ? (
        <ClusterKeepReading
          posts={related.map((item) => ({
            slug: item.slug,
            title: item.title,
            dek: item.dek,
            coverUrl: item.coverUrl,
            tag: CLUSTER_TOPIC_LABEL[item.topic],
          }))}
        />
      ) : null}
    </article>
  );
}

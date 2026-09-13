import Link from "next/link";
import { ClusterKeepReading } from "@/app/components/frontend/ClusterKeepReading";
import { BRAND_LIMITS_LINE, BRAND_SPOKEN } from "@/lib/brand";
import {
  CLUSTER_TOPIC_LABEL,
  learnTopicHref,
  relatedClusterArticles,
  type ClusterArticle,
} from "@/lib/content-cluster";
import { formatBlogDate } from "@/lib/landing-blog";
import "./public-cluster.css";

export function ClusterArticleView({ article }: { article: ClusterArticle }) {
  const related = relatedClusterArticles(article);
  const date = formatBlogDate(article.publishedAt);
  const learnHref = learnTopicHref(article.topic);

  return (
    <article className="fe-cluster">
      <div className="fe-cluster-inner">
        <p className="fe-cluster-kicker">
          <Link href={learnHref}>{CLUSTER_TOPIC_LABEL[article.topic]}</Link>
          {" · "}
          <Link href="/learn">Learn</Link>
        </p>
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
          {BRAND_LIMITS_LINE}{" "}
          <Link href="/limits">Read the limits</Link>.
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
          indexHref={learnHref}
          indexLabel={`More in ${CLUSTER_TOPIC_LABEL[article.topic]}`}
        />
      ) : null}
    </article>
  );
}

import Image from "next/image";
import Link from "next/link";
import {
  estimateClusterReadMinutes,
  listClusterArticles,
  type ClusterArticle,
} from "@/lib/content-cluster";
import { formatBlogDate } from "@/lib/landing-blog";
import "./public-cluster.css";

/** Nexsas blog pattern: fixed crop heights that stagger across 3 columns. */
const HEIGHT_CYCLE = [420, 320, 520] as const;
const COL_START = [0, 1, 2] as const;

function mediaHeight(col: number, row: number): number {
  return HEIGHT_CYCLE[(COL_START[col]! + row) % HEIGHT_CYCLE.length]!;
}

/** Round-robin into columns so the newest three sit across the top. */
function splitIntoColumns(articles: ClusterArticle[], cols: number) {
  const columns: ClusterArticle[][] = Array.from({ length: cols }, () => []);
  articles.forEach((article, i) => {
    columns[i % cols]!.push(article);
  });
  return columns;
}

export function BlogIndex() {
  const articles = listClusterArticles();
  const columns = splitIntoColumns(articles, 3);

  return (
    <div className="fe-cluster fe-cluster--blog">
      <div className="fe-cluster-inner fe-cluster-inner--blog">
        <p className="fe-cluster-kicker">Blog</p>
        <h1 className="fe-cluster-title">EMDR therapy, visual sets, and practice</h1>
        <p className="fe-cluster-dek">
          Guides for practice between sessions — newest first. New here?{" "}
          <Link href="/learn">Learn</Link> is the short start map.
        </p>

        <div className="fe-blog-masonry" role="list">
          {columns.map((colArticles, col) => (
            <div key={col} className="fe-blog-masonry-col" role="presentation">
              {colArticles.map((article, row) => {
                const date = formatBlogDate(article.publishedAt);
                const mins = estimateClusterReadMinutes(article);
                const height = mediaHeight(col, row);
                return (
                  <article key={article.slug} className="fe-blog-masonry-item" role="listitem">
                    <Link href={`/blog/${article.slug}`} className="fe-blog-masonry-card">
                      <span
                        className="fe-blog-masonry-media"
                        style={{ height }}
                      >
                        <Image
                          src={article.coverUrl}
                          alt=""
                          fill
                          sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 33vw"
                          className="fe-blog-masonry-image"
                        />
                      </span>
                      <span className="fe-blog-masonry-body">
                        <span className="fe-blog-masonry-meta">
                          {date ? <span>{date}</span> : null}
                          <span>{mins} min read</span>
                        </span>
                        <span className="fe-blog-masonry-title">{article.title}</span>
                      </span>
                    </Link>
                  </article>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

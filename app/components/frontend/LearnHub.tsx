import Link from "next/link";
import {
  CLUSTER_TOPIC_LABEL,
  clusterArticlesByTopic,
  type ClusterTopic,
} from "@/lib/content-cluster";
import "./public-cluster.css";

const TOPIC_ORDER: ClusterTopic[] = ["understand", "practice", "safety"];

export function LearnHub() {
  const groups = clusterArticlesByTopic();

  return (
    <div className="fe-cluster fe-learn">
      <div className="fe-cluster-inner fe-cluster-inner--wide">
        <header className="fe-learn-intro">
          <p className="fe-cluster-kicker">Learn</p>
          <h1 className="fe-cluster-title">Start with one guide</h1>
          <p className="fe-cluster-dek">
            Short EMDR reading for between sessions.
          </p>
        </header>

        <div className="fe-learn-topics">
          {TOPIC_ORDER.map((topic, index) => {
            const articles = groups[topic];
            if (!articles.length) return null;
            const n = String(index + 1).padStart(2, "0");
            return (
              <section key={topic} className="fe-cluster-group fe-learn-topic">
                <header className="fe-learn-topic-head">
                  <span className="fe-learn-topic-index" aria-hidden>
                    {n}
                  </span>
                  <h2 className="fe-learn-topic-title">
                    {CLUSTER_TOPIC_LABEL[topic]}
                  </h2>
                </header>
                <ul className="fe-cluster-list">
                  {articles.map((article) => (
                    <li key={article.slug}>
                      <Link href={`/blog/${article.slug}`}>
                        <span className="fe-cluster-list-title">
                          {article.title}
                        </span>
                        <span className="fe-cluster-list-dek">{article.dek}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                {topic === "safety" ? (
                  <p className="fe-learn-topic-more">
                    <Link href="/safety">Read the full safety guide</Link>
                  </p>
                ) : null}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

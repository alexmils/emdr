import Link from "next/link";
import {
  CLUSTER_TOPIC_LABEL,
  learnReadingPath,
  type ClusterTopic,
} from "@/lib/content-cluster";
import "./public-cluster.css";

const TOPIC_ORDER: ClusterTopic[] = ["understand", "practice", "safety"];

const TOPIC_BLURB: Record<ClusterTopic, string> = {
  understand: "What EMDR is, how sets work, and how a session is shaped.",
  practice: "Visual sets, grounding, and what to do between appointments.",
  safety: "When to pause, when to stop, and when you need a human.",
};

export function LearnHub() {
  return (
    <div className="fe-cluster fe-learn">
      <div className="fe-cluster-inner fe-cluster-inner--wide">
        <header className="fe-learn-intro">
          <p className="fe-cluster-kicker">Learn</p>
          <h1 className="fe-cluster-title">Learn EMDR — reading paths</h1>
          <p className="fe-cluster-dek">
            Three short paths — pick a topic, read in order. For every guide
            newest-first, see the <Link href="/blog">blog</Link>. Or{" "}
            <Link href="/knowledge">watch Knowledge clips</Link>.
          </p>
        </header>

        <div className="fe-learn-topics">
          {TOPIC_ORDER.map((topic, index) => {
            const articles = learnReadingPath(topic);
            if (!articles.length) return null;
            const n = String(index + 1).padStart(2, "0");
            return (
              <section
                key={topic}
                id={topic}
                className="fe-cluster-group fe-learn-topic"
              >
                <header className="fe-learn-topic-head">
                  <span className="fe-learn-topic-index" aria-hidden>
                    {n}
                  </span>
                  <div>
                    <h2 className="fe-learn-topic-title">
                      {CLUSTER_TOPIC_LABEL[topic]}
                    </h2>
                    <p className="fe-learn-topic-blurb">{TOPIC_BLURB[topic]}</p>
                  </div>
                </header>
                <ol className="fe-cluster-list fe-learn-path">
                  {articles.map((article, step) => (
                    <li key={article.slug}>
                      <Link href={`/blog/${article.slug}`}>
                        <span className="fe-learn-step" aria-hidden>
                          {step + 1}
                        </span>
                        <span className="fe-cluster-list-copy">
                          <span className="fe-cluster-list-title">
                            {article.title}
                          </span>
                          <span className="fe-cluster-list-dek">
                            {article.dek}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
                {topic === "safety" ? (
                  <p className="fe-learn-topic-more">
                    <Link href="/safety">Read the full safety guide</Link>
                  </p>
                ) : null}
              </section>
            );
          })}
        </div>

        <p className="fe-learn-archive">
          Want the full archive with dates?{" "}
          <Link href="/blog">Browse all EMDR articles</Link>.
        </p>
      </div>
    </div>
  );
}

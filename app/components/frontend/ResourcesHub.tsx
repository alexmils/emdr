import Link from "next/link";
import { FrontendBreadcrumbs } from "@/app/components/frontend/FrontendBreadcrumbs";
import { appPath, LOGIN_PATH } from "@/lib/app-base";
import {
  CLUSTER_TOPIC_LABEL,
  clusterArticlesByTopic,
  type ClusterTopic,
} from "@/lib/content-cluster";
import "./public-cluster.css";

const TOPIC_ORDER: ClusterTopic[] = ["understand", "practice", "safety"];

export function ResourcesHub() {
  const groups = clusterArticlesByTopic();

  return (
    <div className="fe-cluster">
      <div className="fe-cluster-inner fe-cluster-inner--wide">
        <FrontendBreadcrumbs
          items={[
            { href: "/", label: "Home" },
            { label: "Resources" },
          ]}
        />
        <p className="fe-cluster-kicker">Resources</p>
        <h1>Guides for EMDR therapy online</h1>
        <p className="fe-cluster-dek">
          Short public reading on visual sets, practice between sessions, and
          when to stop. The moving ball lives in the app — start with{" "}
          <Link href="/emdr">how a Nura EMDR session is structured</Link>.
        </p>

        {TOPIC_ORDER.map((topic) => (
          <section key={topic} className="fe-cluster-group">
            <h2>{CLUSTER_TOPIC_LABEL[topic]}</h2>
            <ul className="fe-cluster-list">
              {groups[topic].map((article) => (
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
          </section>
        ))}

        <p className="fe-cluster-note fe-cluster-note--after">
          These pages are public — no account. Extra notes in the signed-in
          library wait until you join. Self-help software, not a licensed
          therapist.
        </p>

        <div className="fe-cluster-actions">
          <Link href={appPath("/create-account")} className="frontend-btn-primary">
            Get started
          </Link>
          <Link href="/blog" className="frontend-btn-ghost">
            All articles
          </Link>
          <Link href={LOGIN_PATH} className="frontend-btn-ghost">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

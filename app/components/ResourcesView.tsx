"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, ChevronRight, Clock, Play, ShieldAlert } from "lucide-react";
import { appPath } from "@/lib/app-base";
import {
  getResourcesByKind,
  type ResourceItem,
} from "@/lib/resources-content";
import { WorkspaceMenuButton } from "./SidebarNavContext";

function ResourceReadCard({ item }: { item: ResourceItem }) {
  return (
    <Link href={appPath(`/resources/${item.slug}`)} className="resource-read-card">
      <div className="resource-read-card-top">
        <span className="resource-read-card-icon" aria-hidden="true">
          <BookOpen size={18} strokeWidth={2} />
        </span>
        {item.readMinutes ? (
          <span className="resource-read-card-badge">{item.readMinutes} min</span>
        ) : null}
      </div>
      <h3 className="resource-read-card-title">{item.title}</h3>
      <p className="resource-read-card-summary">{item.summary}</p>
      <span className="resource-read-card-cta">Read article</span>
    </Link>
  );
}

function ResourceVideoCard({ item }: { item: ResourceItem }) {
  const ready = Boolean(item.videoUrl);
  const inner = (
    <>
      <div
        className="resource-video-thumb"
        style={{
          background:
            "linear-gradient(145deg, color-mix(in srgb, var(--accent) 18%, #e8e8ea), #f4f4f5)",
        }}
      >
        <span className="resource-video-play" aria-hidden="true">
          <Play size={18} strokeWidth={2.25} />
        </span>
        {item.readMinutes ? (
          <span className="resource-video-duration">{item.readMinutes} min</span>
        ) : null}
      </div>
      <h3 className="resource-video-title">{item.title}</h3>
      <p className="resource-video-summary">{item.summary}</p>
      {!ready ? (
        <span className="resource-video-soon">Video coming soon</span>
      ) : null}
    </>
  );

  if (!ready) {
    return <article className="resource-video-card resource-video-card--soon">{inner}</article>;
  }

  return (
    <a
      href={item.videoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="resource-video-card"
    >
      {inner}
    </a>
  );
}

export function ResourcesLibrary() {
  const videos = getResourcesByKind("video");
  const articles = getResourcesByKind("article");
  const safety = getResourcesByKind("safety");

  return (
    <main className="resources-main flex min-h-0 flex-1 flex-col">
      <header className="workspace-header">
        <div className="workspace-header-row">
          <div className="workspace-header-lead">
            <WorkspaceMenuButton />
            <div className="min-w-0">
              <h1 className="workspace-title">Resources</h1>
              <p className="workspace-hint">
                Short guides to help you use sessions safely
              </p>
            </div>
          </div>
          <Link href={appPath()} className="resources-home-link">
            Home
          </Link>
        </div>
      </header>

      <div className="resources-scroll">
        {videos.length > 0 ? (
          <section className="resources-section" aria-labelledby="resources-watch">
            <h2 id="resources-watch" className="resources-section-title">
              Watch & learn
            </h2>
            <div className="resource-video-track">
              {videos.map((item) => (
                <ResourceVideoCard key={item.slug} item={item} />
              ))}
            </div>
          </section>
        ) : null}

        {articles.length > 0 ? (
          <section className="resources-section" aria-labelledby="resources-read">
            <h2 id="resources-read" className="resources-section-title">
              Read
            </h2>
            <div className="resource-read-grid">
              {articles.map((item) => (
                <ResourceReadCard key={item.slug} item={item} />
              ))}
            </div>
          </section>
        ) : null}

        {safety.length > 0 ? (
          <section className="resources-section" aria-labelledby="resources-safety">
            <h2 id="resources-safety" className="resources-section-title">
              Safety
            </h2>
            {safety.map((item) => (
              <Link
                key={item.slug}
                href={appPath(`/resources/${item.slug}`)}
                className="resource-safety-card"
              >
                <span className="resource-safety-icon" aria-hidden="true">
                  <ShieldAlert size={20} strokeWidth={2} />
                </span>
                <span className="resource-safety-copy">
                  <strong>{item.title}</strong>
                  <span>{item.summary}</span>
                </span>
                <ChevronRight
                  size={16}
                  strokeWidth={2}
                  className="resource-safety-arrow"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  );
}

export function ResourceArticleView({ item }: { item: ResourceItem }) {
  const paragraphs = (item.body ?? "")
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <main className="resources-main flex min-h-0 flex-1 flex-col">
      <header className="workspace-header">
        <div className="workspace-header-row">
          <div className="workspace-header-lead">
            <WorkspaceMenuButton />
            <div className="min-w-0">
              <Link href={appPath("/resources")} className="resource-back-link">
                <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
                Resources
              </Link>
              <h1 className="workspace-title">{item.title}</h1>
              {item.readMinutes ? (
                <p className="workspace-hint resource-article-meta">
                  <Clock size={13} strokeWidth={2} aria-hidden="true" />
                  {item.readMinutes} min read
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <article className="resource-article">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="resource-article-p">
            {paragraph.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
              part.startsWith("**") && part.endsWith("**") ? (
                <strong key={i}>{part.slice(2, -2)}</strong>
              ) : (
                part
              )
            )}
          </p>
        ))}
      </article>
    </main>
  );
}

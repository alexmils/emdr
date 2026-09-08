"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import { appPath } from "@/lib/app-base";
import { getFeaturedResources } from "@/lib/resources-content";

export function LearnTeaser() {
  const featured = getFeaturedResources(3);

  return (
    <section className="learn-teaser" aria-labelledby="learn-teaser-title">
      <div className="learn-teaser-head">
        <h3 id="learn-teaser-title" className="learn-teaser-title">
          Learn
        </h3>
        <Link href={appPath("/resources")} className="learn-teaser-link">
          See all
          <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
        </Link>
      </div>
      <div className="learn-teaser-track">
        {featured.map((item) => (
          <Link
            key={item.slug}
            href={appPath(`/resources/${item.slug}`)}
            className="learn-teaser-card"
          >
            <span className="learn-teaser-card-icon" aria-hidden="true">
              <BookOpen size={16} strokeWidth={2} />
            </span>
            <span className="learn-teaser-card-title">{item.title}</span>
            <span className="learn-teaser-card-summary">{item.summary}</span>
            {item.readMinutes ? (
              <span className="learn-teaser-card-meta">
                <Clock size={12} strokeWidth={2} aria-hidden="true" />
                {item.readMinutes} min read
              </span>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}

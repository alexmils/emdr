"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { appPath } from "@/lib/app-base";
import type { ResourceItem } from "@/lib/resources";

export function LearnTeaser() {
  const [featured, setFeatured] = useState<ResourceItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/resources?featured=1&limit=3");
        const data = await res.json();
        if (!cancelled && res.ok) {
          setFeatured(
            ((data.resources as ResourceItem[]) ?? []).filter(
              (r) => r.kind === "article" || r.kind === "safety"
            )
          );
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (featured.length === 0) return null;

  return (
    <section className="learn-teaser" aria-labelledby="learn-teaser-title">
      <div className="learn-teaser-panel">
        <div className="learn-teaser-head">
          <h3 id="learn-teaser-title" className="learn-teaser-title">
            Before you begin
          </h3>
          <Link href={appPath("/resources")} className="learn-teaser-link">
            Resources
            <ArrowRight size={14} strokeWidth={2.25} aria-hidden="true" />
          </Link>
        </div>
        <ul className="learn-teaser-list">
          {featured.map((item) => (
            <li key={item.slug}>
              <Link
                href={appPath(`/resources/${item.slug}`)}
                className="learn-teaser-row"
              >
                <span className="learn-teaser-row-body">
                  <span className="learn-teaser-row-title">{item.title}</span>
                  {item.summary ? (
                    <span className="learn-teaser-row-summary">
                      {item.summary}
                    </span>
                  ) : null}
                </span>
                {item.readMinutes ? (
                  <span className="learn-teaser-row-meta">
                    {item.readMinutes} min
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

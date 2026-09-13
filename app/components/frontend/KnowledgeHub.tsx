"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { LetterRevealHeading } from "@/app/components/frontend/LetterRevealHeading";
import { KnowledgeSeriesBlock } from "@/app/components/frontend/KnowledgeSeriesBlock";
import {
  KNOWLEDGE_HERO,
  KNOWLEDGE_INTRO,
  KNOWLEDGE_MORE_LINKS,
  KNOWLEDGE_SERIES,
} from "@/lib/knowledge-clips";
import "./knowledge.css";

export function KnowledgeHub() {
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);
  const [heroPlaying, setHeroPlaying] = useState(false);
  const [heroStarted, setHeroStarted] = useState(false);
  const hasHeroVideo = Boolean(KNOWLEDGE_HERO.videoSrc);

  const toggleHero = useCallback(() => {
    const el = heroVideoRef.current;
    if (!el || !hasHeroVideo) return;
    if (el.paused) {
      setHeroStarted(true);
      el.muted = false;
      void el.play().then(
        () => setHeroPlaying(true),
        () => {
          el.muted = true;
          void el.play().then(
            () => setHeroPlaying(true),
            () => setHeroPlaying(false)
          );
        }
      );
    } else {
      el.pause();
      setHeroPlaying(false);
    }
  }, [hasHeroVideo]);

  return (
    <div className="fe-knowledge">
      <section
        className="fe-knowledge-hero"
        aria-labelledby="fe-knowledge-hero-title"
      >
        <div
          className={`fe-knowledge-hero-media${heroPlaying ? " is-playing" : ""}`}
        >
          {hasHeroVideo ? (
            <>
              {!heroStarted ? (
                <Image
                  src={KNOWLEDGE_HERO.poster}
                  alt=""
                  fill
                  priority
                  sizes="100vw"
                  className="fe-knowledge-hero-image"
                />
              ) : null}
              <video
                ref={heroVideoRef}
                className={`fe-knowledge-hero-video${heroStarted ? " is-on" : ""}`}
                src={KNOWLEDGE_HERO.videoSrc}
                poster={KNOWLEDGE_HERO.poster}
                playsInline
                loop
                preload="metadata"
                onPlay={() => setHeroPlaying(true)}
                onPause={() => setHeroPlaying(false)}
              />
            </>
          ) : (
            <Image
              src={KNOWLEDGE_HERO.poster}
              alt=""
              fill
              priority
              sizes="100vw"
              className="fe-knowledge-hero-image"
            />
          )}
          <div className="fe-knowledge-hero-shade" aria-hidden />

          <button
            type="button"
            className={`fe-knowledge-hero-play${heroPlaying ? " is-playing" : ""}`}
            onClick={toggleHero}
            aria-label={heroPlaying ? "Pause video" : "Play video"}
            disabled={!hasHeroVideo}
          >
            {heroPlaying ? (
              <Pause size={30} strokeWidth={1.5} aria-hidden />
            ) : (
              <Play size={30} fill="currentColor" strokeWidth={0} aria-hidden />
            )}
          </button>

          <div className="fe-knowledge-hero-copy">
            <h1
              id="fe-knowledge-hero-title"
              className="fe-knowledge-hero-title"
            >
              {KNOWLEDGE_HERO.title}
            </h1>
            <p className="fe-knowledge-hero-lead">{KNOWLEDGE_HERO.lead}</p>
          </div>
        </div>
      </section>

      <p className="fe-knowledge-intro">{KNOWLEDGE_INTRO}</p>

      <div className="fe-knowledge-body">
        {KNOWLEDGE_SERIES.map((series) => (
          <KnowledgeSeriesBlock key={series.id} series={series} />
        ))}

        <section
          className="fe-knowledge-more"
          aria-labelledby="fe-knowledge-more-title"
        >
          <p className="fe-section-kicker">Keep going</p>
          <LetterRevealHeading
            id="fe-knowledge-more-title"
            className="fe-knowledge-more-title"
          >
            Guides beside the clips
          </LetterRevealHeading>
          <ul className="fe-knowledge-more-list">
            {KNOWLEDGE_MORE_LINKS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="fe-knowledge-more-link">
                  <span className="fe-knowledge-more-label">{item.label}</span>
                  <span className="fe-knowledge-more-dek">{item.dek}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import type { KnowledgeClip, KnowledgeSeries } from "@/lib/knowledge-clips";

type Props = {
  series: KnowledgeSeries;
};

function nextPlayableIndex(
  clips: readonly KnowledgeClip[],
  fromIndex: number
): number {
  const n = clips.length;
  if (n === 0) return -1;
  for (let step = 1; step <= n; step++) {
    const i = (fromIndex + step) % n;
    if (clips[i]?.videoSrc) return i;
  }
  return -1;
}

export function KnowledgeSeriesBlock({ series }: Props) {
  const labelId = useId();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  /** After a chip click / end advance — play the newly selected clip. */
  const autoplayRef = useRef(false);
  const mutedRef = useRef(true);
  const [activeId, setActiveId] = useState(series.clips[0]?.id ?? "");
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(true);

  mutedRef.current = muted;

  const active =
    series.clips.find((c) => c.id === activeId) ?? series.clips[0]!;
  const videoSrc = active.videoSrc;
  const activeIndex = series.clips.findIndex((c) => c.id === active.id);

  const tryPlay = useCallback((el: HTMLVideoElement) => {
    setStarted(true);
    el.muted = mutedRef.current;
    void el.play().then(
      () => setPlaying(true),
      () => {
        el.muted = true;
        setMuted(true);
        mutedRef.current = true;
        void el.play().then(
          () => setPlaying(true),
          () => setPlaying(false)
        );
      }
    );
  }, []);

  // New question → load, then autoplay when requested (chip / playlist advance)
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !videoSrc) {
      setPlaying(false);
      setStarted(false);
      return;
    }

    const wantAutoplay = autoplayRef.current;
    autoplayRef.current = false;

    setPlaying(false);
    if (!wantAutoplay) setStarted(false);

    el.pause();
    el.currentTime = 0;

    let cancelled = false;
    const start = () => {
      if (cancelled || !wantAutoplay) return;
      tryPlay(el);
    };

    const onCanPlay = () => start();
    el.addEventListener("canplay", onCanPlay);
    el.load();
    if (el.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) start();

    return () => {
      cancelled = true;
      el.removeEventListener("canplay", onCanPlay);
    };
  }, [active.id, videoSrc, tryPlay]);

  const selectClip = useCallback(
    (clip: KnowledgeClip) => {
      autoplayRef.current = Boolean(clip.videoSrc);
      if (clip.id === activeId) {
        const el = videoRef.current;
        if (el && clip.videoSrc) {
          el.currentTime = 0;
          tryPlay(el);
        }
        return;
      }
      setActiveId(clip.id);
    },
    [activeId, tryPlay]
  );

  const advancePlaylist = useCallback(() => {
    const next = nextPlayableIndex(series.clips, activeIndex);
    if (next < 0) {
      setPlaying(false);
      setStarted(false);
      return;
    }
    autoplayRef.current = true;
    setActiveId(series.clips[next]!.id);
  }, [activeIndex, series.clips]);

  const togglePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el || !videoSrc) return;
    if (el.paused) {
      tryPlay(el);
    } else {
      el.pause();
      setPlaying(false);
    }
  }, [videoSrc, tryPlay]);

  const toggleMute = useCallback(() => {
    const el = videoRef.current;
    setMuted((m) => {
      const next = !m;
      mutedRef.current = next;
      if (el) el.muted = next;
      return next;
    });
  }, []);

  const onChipKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const idx = series.clips.findIndex((c) => c.id === activeId);
      if (idx < 0) return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        const next = series.clips[(idx + 1) % series.clips.length]!;
        selectClip(next);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        const prev =
          series.clips[(idx - 1 + series.clips.length) % series.clips.length]!;
        selectClip(prev);
      }
    },
    [activeId, series.clips, selectClip]
  );

  return (
    <section className="fe-knowledge-series" aria-labelledby={labelId}>
      <div className={`fe-knowledge-stage${playing ? " is-playing" : ""}`}>
        <div className="fe-knowledge-stage-media">
          {!started ? (
            <Image
              key={`poster-${active.id}`}
              src={active.poster}
              alt=""
              fill
              sizes="(max-width: 900px) 100vw, 56rem"
              className="fe-knowledge-stage-poster"
            />
          ) : null}
          {videoSrc ? (
            <video
              key={active.id}
              ref={videoRef}
              className={`fe-knowledge-stage-video${started ? " is-on" : ""}`}
              src={videoSrc}
              poster={active.poster}
              playsInline
              preload="auto"
              muted={muted}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={advancePlaylist}
            />
          ) : null}
          <div className="fe-knowledge-stage-shade" aria-hidden />
        </div>

        <div className="fe-knowledge-stage-top">
          <div className="fe-knowledge-speaker">
            <h2 id={labelId} className="fe-knowledge-speaker-title">
              {series.title}
            </h2>
            <p className="fe-knowledge-speaker-role">{series.role}</p>
          </div>
          <button
            type="button"
            className="fe-knowledge-mute"
            onClick={videoSrc ? toggleMute : undefined}
            aria-label={
              !videoSrc ? "Sound when clip is ready" : muted ? "Unmute" : "Mute"
            }
            disabled={!videoSrc}
          >
            {muted || !videoSrc ? (
              <VolumeX size={18} strokeWidth={1.75} aria-hidden />
            ) : (
              <Volume2 size={18} strokeWidth={1.75} aria-hidden />
            )}
          </button>
        </div>

        <button
          type="button"
          className={`fe-knowledge-play${playing ? " is-playing" : ""}`}
          onClick={togglePlay}
          aria-label={
            !videoSrc
              ? "Clip coming soon"
              : playing
                ? "Pause video"
                : "Play video"
          }
          disabled={!videoSrc}
        >
          {playing ? (
            <Pause size={28} strokeWidth={1.5} aria-hidden />
          ) : (
            <Play size={28} strokeWidth={0} fill="currentColor" aria-hidden />
          )}
        </button>

        <div
          className="fe-knowledge-chips"
          role="listbox"
          aria-label={`${series.title} questions`}
          aria-activedescendant={`fe-kq-${series.id}-${active.id}`}
          tabIndex={0}
          onKeyDown={onChipKeyDown}
        >
          {series.clips.map((clip) => {
            const selected = clip.id === active.id;
            return (
              <button
                key={clip.id}
                id={`fe-kq-${series.id}-${clip.id}`}
                type="button"
                role="option"
                aria-selected={selected}
                className={`fe-knowledge-chip${selected ? " is-active" : ""}`}
                onClick={() => selectClip(clip)}
              >
                {clip.question}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useRef } from "react";
import "./letter-reveal-heading.css";

/**
 * Aiero-style scroll heading: letters rise from below with staggered delay
 * (clip-path mask + translateY 120% → 0).
 */
export function LetterRevealHeading({
  className,
  id,
  children,
}: {
  className?: string;
  id?: string;
  children: string;
}) {
  const ref = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-in");
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        el.classList.add("is-in");
        io.disconnect();
      },
      { threshold: 0.28, rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const words = children.trim().split(/\s+/);
  let letterIndex = 0;

  return (
    <h2
      ref={ref}
      id={id}
      className={`fe-letter-reveal${className ? ` ${className}` : ""}`}
      aria-label={children}
    >
      <span aria-hidden="true" className="fe-letter-reveal-inner">
        {words.map((word, wi) => (
          <span key={`w-${wi}`} className="fe-letter-word">
            {Array.from(word).map((ch) => {
              const delay = letterIndex / 50;
              const key = `l-${letterIndex}`;
              letterIndex += 1;
              return (
                <span
                  key={key}
                  className="fe-letter"
                  style={{ animationDelay: `${delay}s` }}
                >
                  {ch}
                </span>
              );
            })}
            {wi < words.length - 1 ? (
              <span className="fe-letter-space">{"\u00A0"}</span>
            ) : null}
          </span>
        ))}
      </span>
    </h2>
  );
}

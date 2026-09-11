"use client";

import Image from "next/image";
import type { CSSProperties } from "react";

type AnimatedBrandWaveProps = {
  className?: string;
  size?: "md" | "lg";
  /** 0–100 — color fill progress from left (ink → brand colors) */
  fill?: number;
};

/**
 * Full brand lockup (same files as BrandLockup) — no wave crop / hard tip cut.
 * Soft left→right color fill while loading.
 */
export function AnimatedBrandWave({
  className = "",
  size = "md",
  fill = 100,
}: AnimatedBrandWaveProps) {
  const pct = Math.max(0, Math.min(100, fill));
  const feather = 10;
  const solid = Math.max(0, pct - feather);
  const fade = Math.min(100, pct + feather * 0.4);

  return (
    <div
      className={`fe-brand-wave fe-brand-wave--${size} ${className}`.trim()}
      style={
        {
          ["--fe-wave-solid"]: `${solid}%`,
          ["--fe-wave-fade"]: `${fade}%`,
        } as CSSProperties
      }
      aria-hidden
    >
      <Image
        src="/brand/nura-wave-logo-black.png"
        alt=""
        width={1600}
        height={363}
        className="fe-brand-wave-img fe-brand-wave-img--base"
        unoptimized
        priority
        draggable={false}
      />
      <Image
        src="/brand/nura-wave-logo.png"
        alt=""
        width={1600}
        height={363}
        className="fe-brand-wave-img fe-brand-wave-img--color"
        unoptimized
        priority
        draggable={false}
      />
    </div>
  );
}

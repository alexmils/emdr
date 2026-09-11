"use client";

import { useEffect, useRef, useState } from "react";
import { ribbonBarHeights } from "@/lib/mic-level";
import type { VoicePhase } from "./useGuidedVoiceMode";
import { useMicLevel } from "./useMicLevel";

const BAR_COUNT = 9;

type VoiceWaveProps = {
  phase: VoicePhase;
  active: boolean;
};

function modeForPhase(
  phase: VoicePhase
): "listening" | "ambient" | "quiet" {
  if (phase === "listening") return "listening";
  if (phase === "speaking" || phase === "thinking") return "ambient";
  return "quiet";
}

/**
 * Soft pistachio ribbon meter — echoes the Nura wave, reacts to mic while listening.
 */
export function VoiceWave({ phase, active }: VoiceWaveProps) {
  const listen = active && phase === "listening";
  const micLevel = useMicLevel(listen);
  const micRef = useRef(micLevel);
  micRef.current = micLevel;
  const [heights, setHeights] = useState(() =>
    ribbonBarHeights(0, BAR_COUNT, 0, "quiet")
  );

  useEffect(() => {
    if (!active) return;

    let raf = 0;
    const start = performance.now();
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const frame = (now: number) => {
      const t = (now - start) / 1000;
      const mode = modeForPhase(phase);
      if (reduced) {
        setHeights(
          ribbonBarHeights(listen ? 0.35 : 0.15, BAR_COUNT, 0, "quiet")
        );
      } else {
        const level =
          mode === "listening"
            ? Math.max(micRef.current, 0.08)
            : mode === "ambient"
              ? 0.45
              : 0.1;
        setHeights(ribbonBarHeights(level, BAR_COUNT, t, mode));
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [active, phase, listen]);

  if (!active || phase === "off") return null;

  return (
    <div
      className={`agent-voice-wave agent-voice-wave--${phase}`}
      aria-hidden
    >
      <div className="agent-voice-wave-ribbon">
        {heights.map((h, i) => (
          <span
            key={i}
            className="agent-voice-wave-bar"
            style={{ transform: `scaleY(${h})` }}
          />
        ))}
      </div>
    </div>
  );
}

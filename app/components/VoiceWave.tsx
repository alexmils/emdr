"use client";

import { useEffect, useId, useRef } from "react";
import {
  buildVoiceWavePath,
  waveAmplitude,
} from "@/lib/mic-level";
import type { VoicePhase } from "./useGuidedVoiceMode";
import { useMicLevel } from "./useMicLevel";

const VB_W = 360;
const VB_H = 72;

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
 * Dual pistachio S-ribbons — brand wave, not an equalizer.
 * Always animates a visible idle curve; mic boosts amplitude while listening.
 */
export function VoiceWave({ phase, active }: VoiceWaveProps) {
  const listen = active && phase === "listening";
  const micLevel = useMicLevel(listen);
  const micRef = useRef(micLevel);
  micRef.current = micLevel;
  const pathA = useRef<SVGPathElement>(null);
  const pathB = useRef<SVGPathElement>(null);
  const glow = useRef<SVGEllipseElement>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const uid = useId().replace(/:/g, "");
  const gradA = `nuraVoiceA-${uid}`;
  const gradB = `nuraVoiceB-${uid}`;

  useEffect(() => {
    if (!active) return;

    let raf = 0;
    let running = true;
    const start = performance.now();
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const paint = (now: number) => {
      if (!running) return;
      // Even with reduced motion, keep a gentle drift so it doesn’t look broken
      const t = reduced ? (now - start) / 4000 : (now - start) / 1000;
      const mode = modeForPhase(phaseRef.current);
      const level =
        mode === "listening" ? Math.max(micRef.current, 0.2) : 0.4;
      const amp = waveAmplitude(level, mode);
      const dA = buildVoiceWavePath(VB_W, VB_H, t, amp, 0);
      const dB = buildVoiceWavePath(VB_W, VB_H, t * 0.88, amp * 0.78, 1.35);
      pathA.current?.setAttribute("d", dA);
      pathB.current?.setAttribute("d", dB);
      if (glow.current) {
        const breathe =
          mode === "listening"
            ? 0.65 + micRef.current * 0.5
            : mode === "ambient"
              ? 0.75
              : 0.5;
        glow.current.setAttribute("rx", String(100 + breathe * 50));
        glow.current.setAttribute("ry", String(14 + breathe * 10));
        glow.current.setAttribute("opacity", String(0.2 + breathe * 0.25));
      }
      raf = requestAnimationFrame(paint);
    };
    raf = requestAnimationFrame(paint);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
    };
  }, [active]);

  if (!active || phase === "off") return null;

  return (
    <div
      className={`agent-voice-wave agent-voice-wave--${phase}`}
      aria-hidden
    >
      <svg
        className="agent-voice-wave-svg"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id={gradA} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C6D67E" stopOpacity="0.55" />
            <stop offset="50%" stopColor="#84B067" stopOpacity="1" />
            <stop offset="100%" stopColor="#A4EDA5" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id={gradB} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#A4EDA5" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#C6D67E" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#84B067" stopOpacity="0.45" />
          </linearGradient>
        </defs>
        <ellipse
          ref={glow}
          className="agent-voice-wave-glow"
          cx={VB_W / 2}
          cy={VB_H / 2}
          rx={120}
          ry={20}
          fill="#84B067"
          opacity={0.28}
        />
        <path
          ref={pathB}
          className="agent-voice-wave-stroke agent-voice-wave-stroke--soft"
          fill="none"
          stroke={`url(#${gradB})`}
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
          d={buildVoiceWavePath(VB_W, VB_H, 0, 18, 1.35)}
        />
        <path
          ref={pathA}
          className="agent-voice-wave-stroke"
          fill="none"
          stroke={`url(#${gradA})`}
          strokeWidth={6.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          d={buildVoiceWavePath(VB_W, VB_H, 0, 22, 0)}
        />
      </svg>
    </div>
  );
}

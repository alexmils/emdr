"use client";

import { useEffect, useRef, useState } from "react";
import {
  normalizeMicRms,
  rmsFromTimeDomain,
  smoothLevel,
} from "@/lib/mic-level";

/**
 * Live 0–1 mic level via getUserMedia + AnalyserNode.
 * Safe to run alongside Web Speech — if capture fails, level stays 0 (UI falls back to ambient).
 */
export function useMicLevel(enabled: boolean): number {
  const [level, setLevel] = useState(0);
  const smoothRef = useRef(0);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      smoothRef.current = 0;
      setLevel(0);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      return;
    }

    let cancelled = false;
    let raf = 0;
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;

    const tick = () => {
      if (cancelled || !analyser) return;
      const buf = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(buf);
      const next = normalizeMicRms(rmsFromTimeDomain(buf));
      smoothRef.current = smoothLevel(smoothRef.current, next);
      setLevel(smoothRef.current);
      raf = requestAnimationFrame(tick);
    };

    void (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const AC =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        if (ctx.state === "suspended") {
          await ctx.resume().catch(() => undefined);
        }
        const source = ctx.createMediaStreamSource(stream);
        analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.55;
        source.connect(analyser);
        raf = requestAnimationFrame(tick);
      } catch {
        /* mic blocked or busy — VoiceWave uses ambient motion */
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      void ctx?.close().catch(() => undefined);
      smoothRef.current = 0;
      setLevel(0);
    };
  }, [enabled]);

  return level;
}

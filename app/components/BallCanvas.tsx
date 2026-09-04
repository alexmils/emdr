"use client";

import { useEffect, useRef, useState } from "react";
import type { AnimationMode, SoundMode, VibrationMode } from "@/lib/types";
import { BlsAudioEngine } from "@/lib/bls-audio";
import { rumble } from "@/lib/gamepad";

interface BallCanvasProps {
  running: boolean;
  speedHz: number;
  ballColor: string;
  ballSize: number;
  background: string;
  animation: AnimationMode;
  sound: SoundMode;
  setLengthSec: number;
  repeats: "24" | "infinity";
  vibration: VibrationMode;
  onSetComplete: () => void;
  onToggle: () => void;
  /** Idle center hint; guided wait/check-in hide free start messaging. */
  idleHint?: "default" | "guided_wait" | "check_in";
}

export function BallCanvas({
  running,
  speedHz,
  ballColor,
  ballSize,
  background,
  animation,
  sound,
  setLengthSec,
  repeats,
  vibration,
  onSetComplete,
  onToggle,
  idleHint = "default",
}: BallCanvasProps) {
  const [pos, setPos] = useState(0.5);
  const audioRef = useRef<BlsAudioEngine | null>(null);
  const posRef = useRef(0.5);
  const dirRef = useRef(1);
  const repeatCount = useRef(0);
  const startTime = useRef(0);
  const lastSide = useRef<"left" | "right" | null>(null);
  const rafRef = useRef<number>(0);
  const speedRef = useRef(speedHz);
  const soundRef = useRef(sound);
  const vibrationRef = useRef(vibration);
  const onCompleteRef = useRef(onSetComplete);

  speedRef.current = speedHz;
  soundRef.current = sound;
  vibrationRef.current = vibration;
  onCompleteRef.current = onSetComplete;

  useEffect(() => {
    audioRef.current = new BlsAudioEngine();
    return () => audioRef.current?.dispose();
  }, []);

  useEffect(() => {
    if (!running) {
      cancelAnimationFrame(rafRef.current);
      repeatCount.current = 0;
      startTime.current = 0;
      lastSide.current = null;
      posRef.current = 0.5;
      dirRef.current = 1;
      setPos(0.5);
      return;
    }

    startTime.current = performance.now();
    lastSide.current = null;
    audioRef.current?.playPan("left", soundRef.current);
    lastSide.current = "left";

    const loop = (now: number) => {
      const period = 1 / speedRef.current;
      const step = (1 / 60) / period * 0.5;
      let next = posRef.current + dirRef.current * step;

      if (next >= 1) {
        next = 1;
        dirRef.current = -1;
        repeatCount.current += 1;
        if (vibrationRef.current !== "none") rumble(vibrationRef.current);
        audioRef.current?.playPan("right", soundRef.current);
        lastSide.current = "right";
      } else if (next <= 0) {
        next = 0;
        dirRef.current = 1;
        repeatCount.current += 1;
        if (vibrationRef.current !== "none") rumble(vibrationRef.current);
        audioRef.current?.playPan("left", soundRef.current);
        lastSide.current = "left";
      }

      posRef.current = next;
      setPos(next);

      const elapsed = (now - startTime.current) / 1000;
      const maxRepeats = repeats === "24" ? 24 : Infinity;
      if (repeatCount.current >= maxRepeats || elapsed >= setLengthSec) {
        onCompleteRef.current();
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, repeats, setLengthSec]);

  const leftPct = pos * 100;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.code === "Space") {
          e.preventDefault();
          onToggle();
        }
      }}
      className="workspace-canvas relative h-full min-h-0 flex-1 overflow-hidden outline-none"
      style={{ background }}
    >
      {animation === "flash" && running && (
        <>
          <div
            className="absolute inset-y-0 left-0 w-1/2 transition-opacity duration-75"
            style={{
              background: "rgba(0,0,0,0.06)",
              opacity: pos < 0.5 ? 1 : 0.15,
            }}
          />
          <div
            className="absolute inset-y-0 right-0 w-1/2 transition-opacity duration-75"
            style={{
              background: "rgba(0,0,0,0.06)",
              opacity: pos >= 0.5 ? 1 : 0.15,
            }}
          />
        </>
      )}
      {animation === "dot" && running && (
        <div
          className="absolute top-1/2 rounded-full shadow-md"
          style={{
            width: ballSize,
            height: ballSize,
            background: ballColor,
            left: `calc(${leftPct}% - ${ballSize / 2}px)`,
            transform: "translateY(-50%)",
          }}
        />
      )}
      {!running && idleHint === "default" && (
        <p className="canvas-idle-hint pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-[13px] leading-relaxed">
          <span>
            Press <span className="canvas-idle-hint-strong font-medium">Space</span> or
            click to start
          </span>
        </p>
      )}
      {!running && idleHint === "check_in" && (
        <p className="canvas-idle-hint pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-[13px] leading-relaxed">
          <span>Reply to the check-in, or use Repeat set if you missed this one</span>
        </p>
      )}
    </div>
  );
}

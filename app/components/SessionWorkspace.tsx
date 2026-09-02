"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "./AppProvider";
import { BallCanvas } from "./BallCanvas";
import { BlsToolbar } from "./BlsToolbar";
import { AgentOverlay } from "./AgentOverlay";
import { GearPanel } from "./GearPanel";
import { startGamepadLoop, stopGamepadLoop } from "@/lib/gamepad";

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

export function SessionWorkspace() {
  const {
    threads,
    activeThreadId,
    messages,
    bls,
    setBls,
    sessionMode,
    setSessionMode,
    sendUserMessage,
    requestCheckIn,
    settings,
    updateThreadLocal,
  } = useApp();

  const [running, setRunning] = useState(false);
  const [gearOpen, setGearOpen] = useState(false);
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const thread = threads.find((t) => t.id === activeThreadId);

  const toggleRunning = useCallback(() => {
    if (sessionMode === "check_in") return;
    setRunning((r) => {
      const next = !r;
      setSessionMode(next ? "running" : "idle");
      return next;
    });
  }, [sessionMode, setSessionMode]);

  const handleSetComplete = useCallback(() => {
    setRunning(false);
    setSessionMode("check_in");
    if (thread && thread.phase === "grounding") {
      void updateThreadLocal(thread.id, { phase: "desensitization" });
    }
    void requestCheckIn();
  }, [setSessionMode, thread, updateThreadLocal, requestCheckIn]);

  const playLine = useCallback(async (text: string) => {
    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return;
      const buf = await res.arrayBuffer();
      const blob = new Blob([buf], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      await audio.play();
    } catch {
      /* voice optional */
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      if (isTypingTarget(e.target)) return;
      e.preventDefault();
      toggleRunning();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleRunning]);

  useEffect(() => {
    startGamepadLoop((action) => {
      if (action === "toggle") toggleRunning();
      if (action === "safe_place")
        void sendUserMessage("I need my safe place for a moment.");
      if (action === "speed_up")
        setBls({ speedHz: Math.min(2, bls.speedHz + 0.1) });
      if (action === "speed_down")
        setBls({ speedHz: Math.max(0.5, bls.speedHz - 0.1) });
    });
    return () => stopGamepadLoop();
  }, [toggleRunning, setBls, bls.speedHz, sendUserMessage]);

  useEffect(() => {
    if (running && audioRef.current) {
      audioRef.current.pause();
    }
  }, [running]);

  const handleReply = useCallback(
    async (text: string) => {
      await sendUserMessage(text);
      setSessionMode("idle");
    },
    [sendUserMessage, setSessionMode]
  );

  if (!thread) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-2 px-6">
        <p className="text-headline">Welcome</p>
        <p className="text-footnote max-w-xs text-center text-[var(--text-secondary)]">
          Create or select a session to begin
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-3 p-5 md:p-7">
      <h1 className="text-headline shrink-0 text-center">{thread.title}</h1>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <BallCanvas
          running={running}
          speedHz={bls.speedHz}
          ballColor={bls.ballColor}
          ballSize={bls.ballSize}
          background={bls.background}
          animation={bls.animation}
          sound={bls.sound}
          setLengthSec={bls.setLengthSec}
          repeats={bls.repeats}
          vibrationIntensity={bls.vibrationIntensity}
          onSetComplete={handleSetComplete}
          onToggle={toggleRunning}
          onBallOptions={() => setGearOpen(true)}
        />

        <AgentOverlay
          messages={messages}
          hidden={running}
          autoVoice={settings.autoVoice}
          dockExpanded={!toolbarCollapsed}
          onReply={(t) => void handleReply(t)}
          onPlayLine={(t) => void playLine(t)}
        />

        <BlsToolbar
          bls={bls}
          onChange={setBls}
          collapsed={toolbarCollapsed}
          onToggleCollapse={() => setToolbarCollapsed((c) => !c)}
          dimmed={running}
        />
      </div>

      {gearOpen && (
        <GearPanel
          bls={bls}
          onChange={setBls}
          onClose={() => setGearOpen(false)}
        />
      )}
    </main>
  );
}

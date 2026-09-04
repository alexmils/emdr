"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "./AppProvider";
import { BallCanvas } from "./BallCanvas";
import { BlsToolbar } from "./BlsToolbar";
import { AgentOverlay } from "./AgentOverlay";
import { GearPanel } from "./GearPanel";
import { SessionStatusBar } from "./SessionStatusBar";
import { SessionStartScreen } from "./SessionStartScreen";
import { SessionDescription } from "./SessionDescription";
import { startGamepadLoop, stopGamepadLoop } from "@/lib/gamepad";
import { displayNameFor, useCurrentUser } from "./useCurrentUser";
import {
  adjustBlsToolbarField,
  moveBlsToolbarField,
  normalizeBlsToolbarField,
  speedFieldIndex,
  type BlsToolbarField,
} from "@/lib/bls-toolbar-nav";
import { getActiveSpeedHz } from "@/lib/bls-speed";
import { useGamepadConnected } from "@/lib/useGamepadConnected";
import {
  canRepeatGuidedSet,
  canStartBls,
  showsBlsToolbar,
  showsComposer,
  usesAgent,
} from "@/lib/session-mode";

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
  } = useApp();
  const { user: currentUser } = useCurrentUser();

  const [running, setRunning] = useState(false);
  const [gearOpen, setGearOpen] = useState(false);
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);
  const [focusedField, setFocusedField] = useState<BlsToolbarField>("speed1");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const blsDockRef = useRef<HTMLDivElement>(null);
  const runningRef = useRef(running);
  const toggleRunningRef = useRef<() => void>(() => {});
  const navigateToolbarRef = useRef<
    (direction: "left" | "right" | "up" | "down") => void
  >(() => {});
  const sendUserMessageRef = useRef<(text: string) => Promise<void>>(async () => {});
  const gamepadConnected = useGamepadConnected();
  const focusedFieldRef = useRef(focusedField);
  const gamepadConnectedRef = useRef(gamepadConnected);

  runningRef.current = running;
  focusedFieldRef.current = focusedField;
  gamepadConnectedRef.current = gamepadConnected;

  const thread = threads.find((t) => t.id === activeThreadId);
  const guided = thread ? usesAgent(thread.mode) : false;
  const blsActive = thread != null && thread.mode !== "pending";
  const startAllowed =
    thread != null &&
    canStartBls({
      sessionKind: thread.mode,
      phase: thread.phase,
      sessionMode,
    });
  const repeatAllowed =
    thread != null &&
    canRepeatGuidedSet({
      sessionKind: thread.mode,
      phase: thread.phase,
      sessionMode,
    });
  const toolbarVisible =
    thread != null &&
    showsBlsToolbar({
      sessionKind: thread.mode,
      phase: thread.phase,
      sessionMode,
    });

  const toggleRunning = useCallback(() => {
    if (!blsActive || !thread) return;
    // Always allow stopping a running set (safety).
    if (runningRef.current) {
      setRunning(false);
      setSessionMode("idle");
      return;
    }
    if (
      !canStartBls({
        sessionKind: thread.mode,
        phase: thread.phase,
        sessionMode,
      })
    ) {
      return;
    }
    setRunning(true);
    setSessionMode("running");
  }, [blsActive, thread, sessionMode, setSessionMode]);

  const repeatSet = useCallback(() => {
    if (!thread || !repeatAllowed) return;
    setRunning(true);
    runningRef.current = true;
    setSessionMode("running");
  }, [thread, repeatAllowed, setSessionMode]);

  const handleSetComplete = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    if (!guided) {
      setSessionMode("idle");
      return;
    }
    setSessionMode("check_in");
    void requestCheckIn();
  }, [guided, setSessionMode, requestCheckIn]);

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

  const navigateToolbar = useCallback(
    (direction: "left" | "right" | "up" | "down") => {
      if (!blsActive || !toolbarVisible || toolbarCollapsed) return;

      const connected = gamepadConnectedRef.current;

      if (direction === "left" || direction === "right") {
        setFocusedField((field) => {
          const next = moveBlsToolbarField(
            field,
            direction === "left" ? -1 : 1,
            connected
          );
          const speedIndex = speedFieldIndex(next);
          if (speedIndex !== null) {
            setBls({ activeSpeedPreset: speedIndex });
          }
          return next;
        });
        return;
      }

      const active = normalizeBlsToolbarField(focusedFieldRef.current, connected);
      focusedFieldRef.current = active;
      setFocusedField(active);

      const delta = direction === "up" ? 1 : -1;
      setBls((current) => adjustBlsToolbarField(current, active, delta));
    },
    [blsActive, toolbarVisible, toolbarCollapsed, setBls]
  );

  toggleRunningRef.current = toggleRunning;
  navigateToolbarRef.current = navigateToolbar;
  sendUserMessageRef.current = sendUserMessage;

  useEffect(() => {
    setFocusedField((field) => normalizeBlsToolbarField(field, gamepadConnected));
  }, [gamepadConnected]);

  useEffect(() => {
    setRunning(false);
    runningRef.current = false;
    setSessionMode("idle");
    setGearOpen(false);
  }, [activeThreadId, setSessionMode]);

  useEffect(() => {
    if (!blsActive) return;
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;

      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        toggleRunning();
        return;
      }

      if (e.code === "ArrowUp") {
        e.preventDefault();
        navigateToolbar("up");
        return;
      }

      if (e.code === "ArrowDown") {
        e.preventDefault();
        navigateToolbar("down");
        return;
      }

      if (e.code === "ArrowLeft") {
        e.preventDefault();
        navigateToolbar("left");
        return;
      }

      if (e.code === "ArrowRight") {
        e.preventDefault();
        navigateToolbar("right");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [blsActive, toggleRunning, navigateToolbar]);

  useEffect(() => {
    if (!blsActive) {
      stopGamepadLoop();
      return;
    }
    startGamepadLoop((action) => {
      if (action === "toggle") toggleRunningRef.current();
      if (action === "safe_place") {
        if (!guided) return;
        void sendUserMessageRef.current("I need my safe place for a moment.");
      }
      if (action === "nav_up") navigateToolbarRef.current("up");
      if (action === "nav_down") navigateToolbarRef.current("down");
      if (action === "nav_left") navigateToolbarRef.current("left");
      if (action === "nav_right") navigateToolbarRef.current("right");
    });
    return () => stopGamepadLoop();
  }, [blsActive, guided]);

  useEffect(() => {
    if (running && audioRef.current) {
      audioRef.current.pause();
    }
  }, [running]);

  useEffect(() => {
    if (!toolbarVisible) {
      setGearOpen(false);
      setToolbarCollapsed(false);
    }
  }, [toolbarVisible]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    if (!toolbarVisible) {
      stage.style.setProperty("--bls-dock-height", "0px");
      return;
    }

    const dock = blsDockRef.current;
    if (!dock) return;

    const syncDockHeight = () => {
      stage.style.setProperty("--bls-dock-height", `${dock.offsetHeight}px`);
    };

    syncDockHeight();
    const observer = new ResizeObserver(syncDockHeight);
    observer.observe(dock);
    return () => observer.disconnect();
  }, [toolbarVisible, toolbarCollapsed, gamepadConnected, thread?.mode]);

  const handleReply = useCallback(
    async (text: string) => {
      if (!guided) return;
      await sendUserMessage(text);
      setSessionMode("idle");
    },
    [guided, sendUserMessage, setSessionMode]
  );

  if (!thread) {
    return (
      <main className="workspace-main flex flex-1 flex-col items-center justify-center gap-2 px-6">
        <p className="text-large-title">EMDR Guide</p>
        <p className="text-footnote max-w-sm text-center">
          Select or create a chat to begin your session
        </p>
      </main>
    );
  }

  if (thread.mode === "pending") {
    return (
      <main className="workspace-main flex min-h-0 flex-1 flex-col">
        <header className="workspace-header">
          <div className="workspace-header-row">
            <div className="min-w-0">
              <h1 className="workspace-title">{thread.title}</h1>
              <p className="workspace-hint">Choose a session type to begin</p>
            </div>
          </div>
        </header>
        <SessionStartScreen />
      </main>
    );
  }

  return (
    <main
      className={`workspace-main flex min-h-0 flex-1 flex-col ${running ? "workspace-main--immersive" : ""}`}
      style={running ? { background: bls.background } : undefined}
    >
      <header className="workspace-header">
        <div className="workspace-header-row">
          <div className="min-w-0">
            <h1 className="workspace-title">{thread.title}</h1>
            <SessionDescription
              threadId={thread.id}
              description={thread.description}
            />
          </div>
          {guided && (
            <SessionStatusBar
              phase={thread.phase}
              mode={sessionMode}
              suds={thread.suds}
              voc={thread.voc}
              target={thread.target}
            />
          )}
        </div>
      </header>

      <div
        ref={stageRef}
        className="workspace-stage relative flex min-h-0 flex-1 flex-col"
      >
        {guided && sessionMode === "check_in" && (
          <div className="session-status-float">
            <SessionStatusBar
              phase={thread.phase}
              mode={sessionMode}
              suds={thread.suds}
              voc={thread.voc}
              compact
            />
          </div>
        )}

        <BallCanvas
          running={running}
          speedHz={getActiveSpeedHz(bls)}
          ballColor={bls.ballColor}
          ballSize={bls.ballSize}
          background={bls.background}
          animation={bls.animation}
          sound={bls.sound}
          setLengthSec={bls.setLengthSec}
          repeats={bls.repeats}
          vibration={bls.vibration}
          onSetComplete={handleSetComplete}
          onToggle={toggleRunning}
          idleHint={
            guided
              ? startAllowed
                ? "default"
                : sessionMode === "check_in"
                  ? "check_in"
                  : "guided_wait"
              : "default"
          }
        />

        {showsComposer(thread.mode) && (
          <AgentOverlay
            messages={messages}
            hidden={running}
            autoVoice={settings.autoVoice}
            sessionMode={sessionMode}
            phase={thread.phase}
            userAvatarUrl={currentUser?.avatarUrl}
            userDisplayName={displayNameFor(currentUser)}
            onReply={(t) => void handleReply(t)}
            onPlayLine={(t) => void playLine(t)}
            onRepeatSet={repeatAllowed ? repeatSet : undefined}
          />
        )}

        {toolbarVisible && (
          <BlsToolbar
            ref={blsDockRef}
            bls={bls}
            onChange={setBls}
            collapsed={toolbarCollapsed}
            onToggleCollapse={() => setToolbarCollapsed((c) => !c)}
            onOpenGear={() => setGearOpen(true)}
            focusedField={focusedField}
            onFocusField={setFocusedField}
          />
        )}
      </div>

      {gearOpen && toolbarVisible && (
        <GearPanel
          bls={bls}
          onChange={setBls}
          onClose={() => setGearOpen(false)}
        />
      )}
    </main>
  );
}

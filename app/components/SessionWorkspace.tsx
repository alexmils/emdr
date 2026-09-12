"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useApp } from "./AppProvider";
import { BallCanvas } from "./BallCanvas";
import {
  freeSessionChromeCssVars,
  resolveFreeSessionChrome,
} from "@/lib/free-session-chrome";
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
import { shouldBeginBlsAfterAd } from "@/lib/ads";
import { WorkspaceMenuButton } from "./SidebarNavContext";
import { LearnTeaser } from "./LearnTeaser";
import { BillingChargeHint } from "./BillingChargeHint";
import { useGuidedVoiceMode } from "./useGuidedVoiceMode";

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
    entitlement,
    leaseBlsSeconds,
    openUpgradeModal,
    createThread,
    maybeShowAd,
    noteAdSetCompleted,
    voiceEnabled,
    guidedChatChromeId,
    freeSessionChromeId,
  } = useApp();
  const { user: currentUser } = useCurrentUser();

  const [running, setRunning] = useState(false);
  const [gearOpen, setGearOpen] = useState(false);
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);
  const [focusedField, setFocusedField] = useState<BlsToolbarField>("speed1");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playResolveRef = useRef<(() => void) | null>(null);
  const playGenRef = useRef(0);
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
  const freeLeaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const freeLeaseBusyRef = useRef(false);
  const adGateBusyRef = useRef(false);

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

  const clearFreeLeaseTimer = useCallback(() => {
    if (freeLeaseTimerRef.current) {
      clearTimeout(freeLeaseTimerRef.current);
      freeLeaseTimerRef.current = null;
    }
  }, []);

  const stopFreeBls = useCallback(() => {
    clearFreeLeaseTimer();
    runningRef.current = false;
    setRunning(false);
    setSessionMode("idle");
  }, [clearFreeLeaseTimer, setSessionMode]);

  const continueFreeLease = useCallback(async () => {
    if (!runningRef.current || freeLeaseBusyRef.current) return;
    freeLeaseBusyRef.current = true;
    try {
      const granted = await leaseBlsSeconds(30);
      if (!runningRef.current) return;
      if (granted <= 0) {
        stopFreeBls();
        openUpgradeModal("bls_limit_reached");
        return;
      }
      clearFreeLeaseTimer();
      freeLeaseTimerRef.current = setTimeout(() => {
        void continueFreeLease();
      }, granted * 1000);
    } finally {
      freeLeaseBusyRef.current = false;
    }
  }, [leaseBlsSeconds, stopFreeBls, openUpgradeModal, clearFreeLeaseTimer]);

  const beginBlsRun = useCallback(() => {
    if (!thread) return;
    setRunning(true);
    runningRef.current = true;
    setSessionMode("running");
    if (thread.mode === "free" && entitlement?.isTrialLimited) {
      void continueFreeLease();
    }
  }, [thread, setSessionMode, entitlement, continueFreeLease]);

  const toggleRunning = useCallback(() => {
    if (!blsActive || !thread) return;
    // Always allow stopping a running set (safety).
    if (runningRef.current) {
      clearFreeLeaseTimer();
      runningRef.current = false;
      setRunning(false);
      setSessionMode("idle");
      return;
    }
    if (adGateBusyRef.current) return;
    if (
      !canStartBls({
        sessionKind: thread.mode,
        phase: thread.phase,
        sessionMode,
      })
    ) {
      return;
    }

    if (
      thread.mode === "free" &&
      entitlement?.isTrialLimited &&
      entitlement.blsSecondsRemaining <= 0
    ) {
      openUpgradeModal("bls_limit_reached");
      return;
    }

    if (thread.mode === "free" && entitlement?.isTrialLimited) {
      adGateBusyRef.current = true;
      void (async () => {
        try {
          const result = await maybeShowAd();
          if (!blsActive) return;
          if (shouldBeginBlsAfterAd(result)) {
            beginBlsRun();
          }
        } finally {
          adGateBusyRef.current = false;
        }
      })();
      return;
    }

    beginBlsRun();
  }, [
    blsActive,
    thread,
    sessionMode,
    setSessionMode,
    entitlement,
    openUpgradeModal,
    clearFreeLeaseTimer,
    maybeShowAd,
    beginBlsRun,
  ]);

  useEffect(() => {
    return () => clearFreeLeaseTimer();
  }, [clearFreeLeaseTimer]);

  const repeatSet = useCallback(() => {
    if (!thread || !repeatAllowed) return;
    setRunning(true);
    runningRef.current = true;
    setSessionMode("running");
  }, [thread, repeatAllowed, setSessionMode]);

  const handleSetComplete = useCallback(() => {
    clearFreeLeaseTimer();
    runningRef.current = false;
    setRunning(false);
    if (!guided) {
      noteAdSetCompleted();
      setSessionMode("idle");
      return;
    }
    setSessionMode("check_in");
    void requestCheckIn();
  }, [
    guided,
    setSessionMode,
    requestCheckIn,
    clearFreeLeaseTimer,
    noteAdSetCompleted,
  ]);

  const stopPlayback = useCallback(() => {
    playGenRef.current += 1;
    if (audioRef.current) {
      audioRef.current.pause();
      try {
        URL.revokeObjectURL(audioRef.current.src);
      } catch {
        /* ignore */
      }
      audioRef.current = null;
    }
    const resolve = playResolveRef.current;
    playResolveRef.current = null;
    resolve?.();
  }, []);

  const playLine = useCallback(
    async (text: string) => {
      stopPlayback();
      const gen = playGenRef.current;
      try {
        const res = await fetch("/api/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (gen !== playGenRef.current) return;
        if (!res.ok) return;
        const buf = await res.arrayBuffer();
        if (gen !== playGenRef.current) return;
        const blob = new Blob([buf], { type: "audio/mpeg" });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        await new Promise<void>((resolve) => {
          let settled = false;
          const done = () => {
            if (settled) return;
            settled = true;
            if (playResolveRef.current === done) playResolveRef.current = null;
            try {
              URL.revokeObjectURL(url);
            } catch {
              /* ignore */
            }
            resolve();
          };
          playResolveRef.current = done;
          audio.addEventListener("ended", done, { once: true });
          audio.addEventListener("error", done, { once: true });
          void audio.play().catch(() => done());
        });
      } catch {
        /* voice optional */
      }
    },
    [stopPlayback]
  );

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
    if (running) setGearOpen(false);
  }, [running]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    if (!toolbarVisible || running) {
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
  }, [toolbarVisible, toolbarCollapsed, gamepadConnected, thread?.mode, running]);

  const handleReply = useCallback(
    async (text: string) => {
      if (!guided) return { startSet: false as const };
      const result = await sendUserMessage(text);
      setSessionMode("idle");
      return result;
    },
    [guided, sendUserMessage, setSessionMode]
  );

  const lastAgent = [...messages].reverse().find((m) => m.role === "agent");

  const voice = useGuidedVoiceMode({
    voiceFeatureOn: Boolean(voiceEnabled && guided),
    sessionKind: thread?.mode ?? "pending",
    phase: thread?.phase ?? "intake",
    sessionMode,
    running,
    onSend: handleReply,
    onPlayLine: playLine,
    onBeginBls: beginBlsRun,
    lastAgentId: lastAgent?.id ?? null,
    lastAgentContent: lastAgent?.content ?? null,
  });

  const exitVoiceMode = voice.exit;
  const exitVoice = useCallback(() => {
    stopPlayback();
    exitVoiceMode();
  }, [stopPlayback, exitVoiceMode]);

  useEffect(() => () => stopPlayback(), [stopPlayback]);

  if (!thread) {
    return (
      <main className="workspace-main flex min-h-0 flex-1 flex-col">
        <header className="workspace-header">
          <div className="workspace-header-row">
            <div className="workspace-header-lead">
              <WorkspaceMenuButton />
              <div className="min-w-0">
                <h1 className="workspace-title">Nura</h1>
              </div>
            </div>
            <BillingChargeHint />
          </div>
        </header>
        <div className="workspace-home-empty flex flex-1 flex-col items-center justify-center gap-6 px-6 py-8">
          <div className="workspace-home-empty-top flex flex-col items-center gap-4 text-center">
            <h2 className="session-start-title">
              Start a session
            </h2>
            <p className="session-start-subtitle max-w-md">
              Open a new chat to choose Guided or Free mode.
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => void createThread()}
            >
              New chat
            </button>
          </div>
          <div className="workspace-home-empty-learn">
            <LearnTeaser />
          </div>
        </div>
      </main>
    );
  }

  if (thread.mode === "pending") {
    return (
      <main className="workspace-main flex min-h-0 flex-1 flex-col">
        <header className="workspace-header">
          <div className="workspace-header-row">
            <div className="workspace-header-lead">
              <WorkspaceMenuButton />
              <div className="min-w-0">
                <h1 className="workspace-title">{thread.title}</h1>
                <p className="workspace-hint">Choose a session type to begin</p>
              </div>
            </div>
            <BillingChargeHint />
          </div>
        </header>
        <SessionStartScreen />
      </main>
    );
  }

  return (
    <main
      className={`workspace-main flex min-h-0 flex-1 flex-col${
        running ? " workspace-main--immersive" : ""
      }${thread.mode === "free" ? " workspace-main--free-chrome" : ""}`}
      style={
        {
          ...(running ? { background: bls.background } : null),
          ...(thread.mode === "free"
            ? freeSessionChromeCssVars(
                resolveFreeSessionChrome(freeSessionChromeId).theme
              )
            : null),
        } as CSSProperties
      }
    >
      <header className="workspace-header">
        <div className="workspace-header-row">
          <div className="workspace-header-lead">
            <WorkspaceMenuButton />
            <div className="min-w-0">
              <h1 className="workspace-title">{thread.title}</h1>
              <SessionDescription
                threadId={thread.id}
                description={thread.description}
              />
            </div>
          </div>
          <div className="workspace-header-trail">
            <BillingChargeHint />
            {guided ? (
              <SessionStatusBar
                phase={thread.phase}
                mode={sessionMode}
                suds={thread.suds}
                voc={thread.voc}
                target={thread.target}
              />
            ) : null}
          </div>
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
            voiceAvailable={voice.available}
            voiceActive={voice.active}
            voicePhase={voice.phase}
            voiceInterim={voice.interim}
            voiceError={voice.error}
            onEnterVoice={voice.enter}
            onExitVoice={exitVoice}
            chromeId={guidedChatChromeId}
          />
        )}

        {toolbarVisible && !running && (
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

      {gearOpen && toolbarVisible && !running && (
        <GearPanel
          bls={bls}
          onChange={setBls}
          onClose={() => setGearOpen(false)}
        />
      )}
    </main>
  );
}

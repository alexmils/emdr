"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, AudioLines, Mic, Volume2, X } from "lucide-react";
import type { Message, ProtocolPhase } from "@/lib/types";
import type { SessionMode } from "@/lib/protocol";
import {
  checkInPlaceholder,
  checkInQuickReplies,
} from "@/lib/session-labels";
import {
  isBrowserSpeechSupported,
  startBrowserSpeech,
  type BrowserSpeechSession,
} from "@/lib/browser-speech";
import { Avatar } from "./Avatar";
import type { VoicePhase } from "./useGuidedVoiceMode";
import { VoiceWave } from "./VoiceWave";

const GUIDE_AVATAR = "/brand/nura-circle-variants/G-black-on-mint-128.png";

interface AgentOverlayProps {
  messages: Message[];
  hidden: boolean;
  autoVoice: boolean;
  sessionMode: SessionMode;
  phase: ProtocolPhase;
  userAvatarUrl?: string | null;
  userDisplayName?: string;
  onReply: (text: string) => void;
  onPlayLine: (text: string) => void;
  onRepeatSet?: () => void;
  voiceAvailable?: boolean;
  voiceActive?: boolean;
  voicePhase?: VoicePhase;
  voiceInterim?: string;
  voiceError?: string | null;
  onEnterVoice?: () => void;
  onExitVoice?: () => void;
}

function voiceStatusLabel(phase: VoicePhase): string {
  switch (phase) {
    case "listening":
      return "Listening…";
    case "thinking":
      return "Thinking…";
    case "speaking":
      return "Speaking…";
    case "bls":
      return "Follow the ball";
    default:
      return "Voice";
  }
}

export function AgentOverlay({
  messages,
  hidden,
  autoVoice,
  sessionMode,
  phase,
  userAvatarUrl,
  userDisplayName = "You",
  onReply,
  onPlayLine,
  onRepeatSet,
  voiceAvailable = false,
  voiceActive = false,
  voicePhase = "off",
  voiceInterim = "",
  voiceError = null,
  onEnterVoice,
  onExitVoice,
}: AgentOverlayProps) {
  const [reply, setReply] = useState("");
  const [rollKey, setRollKey] = useState(0);
  const [dictating, setDictating] = useState(false);
  const [dictationError, setDictationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const dictationRef = useRef<BrowserSpeechSession | null>(null);
  const dictationBaseRef = useRef("");
  const lastAgent = [...messages].reverse().find((m) => m.role === "agent");
  const prevId = useRef<string | null>(null);
  const checkIn = sessionMode === "check_in";
  const intake = phase === "intake";
  const showQuickReplies = checkIn || intake;
  const quickReplies = showQuickReplies ? checkInQuickReplies(phase) : [];
  const canSend = reply.trim().length > 0;
  const userInitial = userDisplayName.trim().charAt(0) || "U";
  /** Chat bubbles only after the user has replied once; open session = centered prompt. */
  const conversationStarted = messages.some((m) => m.role === "user");
  const showDictationMic = isBrowserSpeechSupported();
  const showVoiceMode = Boolean(voiceAvailable && onEnterVoice);

  const stopDictation = () => {
    dictationRef.current?.abort();
    dictationRef.current = null;
    setDictating(false);
  };

  const toggleDictation = () => {
    if (dictating) {
      stopDictation();
      return;
    }
    setDictationError(null);
    dictationBaseRef.current = reply.trim();
    const session = startBrowserSpeech({
      onInterim: (t) => {
        const base = dictationBaseRef.current;
        setReply(base ? `${base} ${t}`.trim() : t);
      },
      onFinal: (chunk) => {
        dictationBaseRef.current =
          `${dictationBaseRef.current} ${chunk}`.trim();
        setReply(dictationBaseRef.current);
      },
      onError: (code, message) => {
        if (code === "aborted" || code === "no-speech") return;
        setDictationError(message);
        stopDictation();
      },
    });
    if (!session) {
      setDictationError(
        "Voice isn’t supported in this browser — try Chrome or Edge."
      );
      return;
    }
    dictationRef.current = session;
    setDictating(true);
  };

  useEffect(() => {
    if (voiceActive) stopDictation();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when entering voice mode
  }, [voiceActive]);

  useEffect(() => () => stopDictation(), []);

  useEffect(() => {
    if (lastAgent && lastAgent.id !== prevId.current) {
      prevId.current = lastAgent.id;
      setRollKey((k) => k + 1);
      if (autoVoice && !hidden && !voiceActive) onPlayLine(lastAgent.content);
    }
  }, [lastAgent, autoVoice, hidden, onPlayLine, voiceActive]);

  useEffect(() => {
    if ((checkIn || intake) && !hidden && !voiceActive) {
      inputRef.current?.focus();
    }
  }, [checkIn, intake, hidden, lastAgent?.id, voiceActive]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, hidden, conversationStarted, voiceInterim]);

  if (hidden) return null;

  const voiceDock = voiceActive ? (
    <div className="agent-voice-dock">
      <VoiceWave active={voiceActive} phase={voicePhase} />
      <div className="agent-voice-bar" role="status" aria-live="polite">
        <div
          className={`agent-voice-orb agent-voice-orb--${voicePhase}`}
          aria-hidden
        />
        <div className="agent-voice-meta">
          <p className="agent-voice-status">{voiceStatusLabel(voicePhase)}</p>
          {voiceInterim ? (
            <p className="agent-voice-interim">{voiceInterim}</p>
          ) : null}
          {voiceError ? <p className="agent-voice-error">{voiceError}</p> : null}
        </div>
        <button
          type="button"
          className="agent-voice-end"
          onClick={onExitVoice}
          aria-label="End voice"
        >
          <X size={16} strokeWidth={2.25} />
          <span>End voice</span>
        </button>
      </div>
    </div>
  ) : null;

  const composer = voiceActive ? (
    voiceDock
  ) : (
    <div
      className={`agent-composer-wrap ${!conversationStarted ? "agent-fade-up agent-fade-up--late" : ""}`}
    >
      <form
        className={`agent-composer${showDictationMic ? " agent-composer--with-mic" : ""}`}
        onSubmit={(e) => {
          e.preventDefault();
          if (!canSend) return;
          stopDictation();
          onReply(reply.trim());
          setReply("");
        }}
      >
        {showDictationMic ? (
          <button
            type="button"
            className={`agent-composer-mic${dictating ? " is-listening" : ""}`}
            onClick={toggleDictation}
            aria-label={dictating ? "Stop dictation" : "Dictate"}
            aria-pressed={dictating}
            title={dictating ? "Stop dictation" : "Dictate"}
          >
            <Mic size={22} strokeWidth={2.25} />
          </button>
        ) : null}
        <input
          ref={inputRef}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder={
            checkIn || intake
              ? checkInPlaceholder(phase)
              : "Message the guide…"
          }
          className="agent-composer-input"
          aria-label="Message the guide"
        />
        {canSend ? (
          <button
            type="submit"
            className="agent-composer-send"
            aria-label="Send"
          >
            <ArrowUp size={22} strokeWidth={2.25} />
          </button>
        ) : showVoiceMode ? (
          <button
            type="button"
            className="agent-composer-voice-mode"
            onClick={() => {
              stopDictation();
              onEnterVoice?.();
            }}
            aria-label="Start voice"
            title="Start voice"
          >
            <AudioLines size={22} strokeWidth={2.25} />
          </button>
        ) : null}
      </form>
      {dictationError ? (
        <p className="agent-composer-hint" role="status">
          {dictationError}
        </p>
      ) : null}
    </div>
  );

  const quickReplyRow =
    !voiceActive && quickReplies.length > 0 ? (
      <div
        className={`agent-quick-replies ${!conversationStarted ? "agent-fade-up agent-fade-up--late" : ""}`}
        role="group"
        aria-label="Quick replies"
      >
        {quickReplies.map((q) => (
          <button
            key={q.label}
            type="button"
            className="agent-quick-reply"
            onClick={() => {
              if (q.value.endsWith(" ")) {
                setReply(q.value);
                inputRef.current?.focus();
                return;
              }
              onReply(q.value);
            }}
          >
            {q.label}
          </button>
        ))}
      </div>
    ) : null;

  const checkInBanner = checkIn ? (
    <div className="agent-checkin-banner-row agent-fade-up">
      <p className="agent-checkin-banner">
        Set complete — share what you notice, or repeat if you missed it.
      </p>
      {onRepeatSet && !voiceActive && (
        <button
          type="button"
          className="agent-repeat-set"
          onClick={onRepeatSet}
        >
          Repeat set
        </button>
      )}
    </div>
  ) : null;

  if (!conversationStarted) {
    return (
      <div
        className={`agent-overlay agent-overlay--prompt ${checkIn ? "agent-overlay--check-in" : ""} ${intake ? "agent-overlay--intake" : ""} ${voiceActive ? "agent-overlay--voice" : ""}`}
      >
        <div className="agent-overlay-inner">
          {checkInBanner}
          <div className="agent-overlay-body">
            {lastAgent && (
              <div key={rollKey} className="agent-overlay-line agent-fade-up">
                <p className="agent-overlay-text">{lastAgent.content}</p>
                {!voiceActive && (
                  <button
                    type="button"
                    onClick={() => onPlayLine(lastAgent.content)}
                    className="btn-icon-sm"
                    aria-label="Play message"
                  >
                    <Volume2 size={18} strokeWidth={2} />
                  </button>
                )}
              </div>
            )}
          </div>
          {quickReplyRow}
          {composer}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`agent-overlay agent-overlay--thread ${checkIn ? "agent-overlay--check-in" : ""} ${voiceActive ? "agent-overlay--voice" : ""}`}
    >
      <div className="agent-overlay-inner">
        {checkInBanner}

        <div ref={listRef} className="agent-chat-messages">
          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div
                key={m.id}
                className={`agent-chat-row ${isUser ? "agent-chat-row--user" : "agent-chat-row--agent"}`}
              >
                {!isUser && (
                  <Avatar
                    src={GUIDE_AVATAR}
                    alt="Nura"
                    fallback="N"
                    className="avatar-sm avatar-guide"
                  />
                )}
                <div
                  className={`agent-chat-bubble ${isUser ? "agent-chat-bubble--user" : "agent-chat-bubble--agent"}`}
                >
                  <p className="agent-chat-text">{m.content}</p>
                  {!isUser && !voiceActive && (
                    <button
                      type="button"
                      onClick={() => onPlayLine(m.content)}
                      className="btn-icon-sm agent-chat-voice"
                      aria-label="Play message"
                    >
                      <Volume2 size={17} strokeWidth={2} />
                    </button>
                  )}
                </div>
                {isUser && (
                  <Avatar
                    src={userAvatarUrl}
                    alt={userDisplayName}
                    fallback={userInitial}
                    className="avatar-sm"
                  />
                )}
              </div>
            );
          })}
        </div>

        {quickReplyRow}
        {composer}
      </div>
    </div>
  );
}

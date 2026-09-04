"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Volume2 } from "lucide-react";
import type { Message, ProtocolPhase } from "@/lib/types";
import type { SessionMode } from "@/lib/protocol";
import {
  checkInPlaceholder,
  checkInQuickReplies,
} from "@/lib/session-labels";
import { Avatar } from "./Avatar";

const GUIDE_AVATAR = "/guide-avatar.svg";

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
}: AgentOverlayProps) {
  const [reply, setReply] = useState("");
  const [rollKey, setRollKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const lastAgent = [...messages].reverse().find((m) => m.role === "agent");
  const prevId = useRef<string | null>(null);
  const checkIn = sessionMode === "check_in";
  const quickReplies = checkIn ? checkInQuickReplies(phase) : [];
  const canSend = reply.trim().length > 0;
  const userInitial = userDisplayName.trim().charAt(0) || "U";
  /** Chat bubbles only after the user has replied once; open session = centered prompt. */
  const conversationStarted = messages.some((m) => m.role === "user");

  useEffect(() => {
    if (lastAgent && lastAgent.id !== prevId.current) {
      prevId.current = lastAgent.id;
      setRollKey((k) => k + 1);
      if (autoVoice && !hidden) onPlayLine(lastAgent.content);
    }
  }, [lastAgent, autoVoice, hidden, onPlayLine]);

  useEffect(() => {
    if (checkIn && !hidden) {
      inputRef.current?.focus();
    }
  }, [checkIn, hidden, lastAgent?.id]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, hidden, conversationStarted]);

  if (hidden) return null;

  const composer = (
    <form
      className={`agent-composer ${!conversationStarted ? "agent-fade-up agent-fade-up--late" : ""}`}
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSend) return;
        onReply(reply.trim());
        setReply("");
      }}
    >
      <input
        ref={inputRef}
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder={
          checkIn ? checkInPlaceholder(phase) : "Message the guide…"
        }
        className="agent-composer-input"
        aria-label="Message the guide"
      />
      <button
        type="submit"
        className="agent-composer-send"
        disabled={!canSend}
        aria-label="Send"
      >
        <ArrowUp size={18} strokeWidth={2.25} />
      </button>
    </form>
  );

  const quickReplyRow =
    quickReplies.length > 0 ? (
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
      {onRepeatSet && (
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
        className={`agent-overlay agent-overlay--prompt ${checkIn ? "agent-overlay--check-in" : ""}`}
      >
        <div className="agent-overlay-inner">
          {checkInBanner}
          <div className="agent-overlay-body">
            {lastAgent && (
              <div key={rollKey} className="agent-overlay-line agent-fade-up">
                <p className="agent-overlay-text">{lastAgent.content}</p>
                <button
                  type="button"
                  onClick={() => onPlayLine(lastAgent.content)}
                  className="btn-icon-sm"
                  aria-label="Play message"
                >
                  <Volume2 size={15} strokeWidth={2} />
                </button>
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
      className={`agent-overlay agent-overlay--thread ${checkIn ? "agent-overlay--check-in" : ""}`}
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
                    alt="Guide"
                    fallback="G"
                    className="avatar-sm"
                  />
                )}
                <div
                  className={`agent-chat-bubble ${isUser ? "agent-chat-bubble--user" : "agent-chat-bubble--agent"}`}
                >
                  <p className="agent-chat-text">{m.content}</p>
                  {!isUser && (
                    <button
                      type="button"
                      onClick={() => onPlayLine(m.content)}
                      className="btn-icon-sm agent-chat-voice"
                      aria-label="Play message"
                    >
                      <Volume2 size={14} strokeWidth={2} />
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

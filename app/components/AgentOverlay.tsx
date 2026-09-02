"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import type { Message } from "@/lib/types";

interface AgentOverlayProps {
  messages: Message[];
  hidden: boolean;
  autoVoice: boolean;
  dockExpanded?: boolean;
  onReply: (text: string) => void;
  onPlayLine: (text: string) => void;
}

export function AgentOverlay({
  messages,
  hidden,
  autoVoice,
  dockExpanded = true,
  onReply,
  onPlayLine,
}: AgentOverlayProps) {
  const [hovered, setHovered] = useState(false);
  const [reply, setReply] = useState("");
  const [rollKey, setRollKey] = useState(0);
  const lastAgent = [...messages].reverse().find((m) => m.role === "agent");
  const prevId = useRef<string | null>(null);

  useEffect(() => {
    if (lastAgent && lastAgent.id !== prevId.current) {
      prevId.current = lastAgent.id;
      setRollKey((k) => k + 1);
      if (autoVoice && !hidden) onPlayLine(lastAgent.content);
    }
  }, [lastAgent, autoVoice, hidden, onPlayLine]);

  if (hidden) return null;

  const agentMessages = messages.filter((m) => m.role === "agent");
  const history = agentMessages.slice(0, -1);
  const showHistory = hovered && history.length > 0;

  return (
    <div
      className={`pointer-events-none absolute left-1/2 z-10 w-[min(92%,30rem)] -translate-x-1/2 transition-[bottom] duration-300 ease-out ${
        dockExpanded ? "bottom-[6.5rem]" : "bottom-4"
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={`agent-overlay-mask glass-overlay pointer-events-auto rounded-[20px] px-5 pb-4 pt-9 transition-all duration-300 ease-out ${
          showHistory ? "max-h-72" : "max-h-36"
        } overflow-hidden`}
      >
        {showHistory && (
          <div className="mb-3 space-y-2.5 border-b border-[var(--separator)] pb-3 text-[12px] leading-relaxed text-[var(--text-secondary)]">
            {history.map((m) => (
              <p key={m.id} className="opacity-80">
                {m.content}
              </p>
            ))}
          </div>
        )}
        {lastAgent && (
          <div
            key={rollKey}
            className="agent-roll-enter flex items-start gap-2.5 text-[13px] leading-relaxed text-[var(--text)]"
          >
            <p className="flex-1">{lastAgent.content}</p>
            <button
              type="button"
              onClick={() => onPlayLine(lastAgent.content)}
              className="btn-icon shrink-0 !bg-transparent"
              aria-label="Play message"
            >
              <Volume2 size={16} strokeWidth={2} />
            </button>
          </div>
        )}
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!reply.trim()) return;
            onReply(reply.trim());
            setReply("");
          }}
        >
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="What do you notice?"
            className="field field-pill flex-1 !py-2 text-[13px]"
          />
          <button type="submit" className="btn-primary shrink-0 !px-5">
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}

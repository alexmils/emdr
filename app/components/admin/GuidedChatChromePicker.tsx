"use client";

import type { CSSProperties } from "react";
import { AudioLines, Mic, Volume2 } from "lucide-react";
import {
  GUIDED_CHAT_CHROMES,
  guidedChatChromeCssVars,
  type GuidedChatChrome,
} from "@/lib/guided-chat-chrome";
import "./guided-chat-chrome-picker.css";

type GuidedChatChromePickerProps = {
  value: number;
  onChange: (id: number) => void;
  disabled?: boolean;
};

function MiniPreview({ chrome }: { chrome: GuidedChatChrome }) {
  const vars = guidedChatChromeCssVars(chrome.theme) as CSSProperties;
  return (
    <div className="gc-pick-preview" style={vars} aria-hidden>
      <div className="gc-pick-row">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={chrome.avatar} alt="" width={28} height={28} className="gc-pick-avatar" />
        <div className="gc-pick-bubble gc-pick-bubble--agent">
          <span>Welcome — what would you like to work on?</span>
          <Volume2 size={12} strokeWidth={2} className="gc-pick-speak" />
        </div>
      </div>
      <div className="gc-pick-row gc-pick-row--user">
        <div className="gc-pick-bubble gc-pick-bubble--user">
          <span>Not sure yet</span>
        </div>
        <span className="gc-pick-user-av">4</span>
      </div>
      <div className="gc-pick-chips">
        <span>Anxiety</span>
        <span>Stress</span>
      </div>
      <div className="gc-pick-composer">
        <Mic size={14} strokeWidth={2} className="gc-pick-mic" />
        <span className="gc-pick-ph">Anxiety, a memory…</span>
        <span className="gc-pick-voice">
          <AudioLines size={14} strokeWidth={2.25} />
        </span>
      </div>
    </div>
  );
}

export function GuidedChatChromePicker({
  value,
  onChange,
  disabled = false,
}: GuidedChatChromePickerProps) {
  return (
    <div className="gc-pick">
      <div className="gc-pick-grid">
        {GUIDED_CHAT_CHROMES.map((chrome) => {
          const selected = chrome.id === value;
          return (
            <button
              key={chrome.id}
              type="button"
              disabled={disabled}
              className={`gc-pick-card${selected ? " is-selected" : ""}`}
              onClick={() => onChange(chrome.id)}
              aria-pressed={selected}
            >
              <span className="gc-pick-head">
                <span className="gc-pick-num">{chrome.id}</span>
                <span className="gc-pick-meta">
                  <span className="gc-pick-title">{chrome.title}</span>
                  <span className="gc-pick-note">{chrome.note}</span>
                </span>
              </span>
              <MiniPreview chrome={chrome} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

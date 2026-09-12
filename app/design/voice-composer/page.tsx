import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { AudioLines, Mic, Volume2 } from "lucide-react";
import {
  GUIDED_CHAT_CHROMES,
  guidedChatChromeCssVars,
  type GuidedChatChrome,
} from "@/lib/guided-chat-chrome";
import "./voice-composer-lab.css";

export const metadata: Metadata = {
  title: "Voice composer chrome — pick one",
  robots: { index: false, follow: false },
};

function ChatMock({ chrome }: { chrome: GuidedChatChrome }) {
  const t = chrome.theme;
  const vars = guidedChatChromeCssVars(t) as CSSProperties;
  return (
    <article
      className="vc-lab-card"
      style={{ ...vars, background: t.cardBg, color: t.text }}
    >
      <header className="vc-lab-card-head">
        <span className="vc-lab-num">{chrome.id}</span>
        <div>
          <h2 className="vc-lab-title">{chrome.title}</h2>
          <p className="vc-lab-note" style={{ color: t.muted }}>
            {chrome.note}
          </p>
        </div>
      </header>

      <div className="vc-lab-thread">
        <div className="vc-lab-row vc-lab-row--agent">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={chrome.avatar}
            alt=""
            width={44}
            height={44}
            className="vc-lab-avatar"
          />
          <div
            className="vc-lab-bubble vc-lab-bubble--agent"
            style={{
              background: t.agentBg,
              borderColor: t.agentBorder,
            }}
          >
            <p style={{ color: t.agentText }}>
              Welcome. In a few words — what would you like to work on today?
            </p>
            <Volume2
              className="vc-lab-speak"
              size={16}
              strokeWidth={2}
              aria-hidden
              style={{ color: t.speak }}
            />
          </div>
        </div>

        <div className="vc-lab-row vc-lab-row--user">
          <div
            className="vc-lab-bubble vc-lab-bubble--user"
            style={{
              background: t.userBg,
              borderColor: t.userBorder,
            }}
          >
            <p style={{ color: t.userText }}>
              I&apos;m not sure yet — can you help me figure it out?
            </p>
          </div>
          <div
            className="vc-lab-avatar vc-lab-avatar--user"
            aria-hidden
            style={{ background: t.userAvatarBg, color: t.userAvatarFg }}
          >
            4
          </div>
        </div>

        <div className="vc-lab-chips" aria-hidden>
          {["Anxiety", "Stress", "A specific memory", "Not sure yet"].map(
            (label) => (
              <span
                key={label}
                style={{
                  background: t.chipBg,
                  borderColor: t.chipBorder,
                  color: t.chipText,
                }}
              >
                {label}
              </span>
            )
          )}
        </div>
      </div>

      <div
        className="vc-lab-composer"
        aria-hidden
        style={{
          background: t.composerBg,
          borderColor: t.composerBorder,
        }}
      >
        <span className="vc-lab-mic" style={{ color: t.mic }}>
          <Mic size={20} strokeWidth={2} />
        </span>
        <span className="vc-lab-placeholder" style={{ color: t.placeholder }}>
          Anxiety, a memory…
        </span>
        <span
          className="vc-lab-voice"
          style={{
            background: t.voiceBg,
            color: t.voiceFg,
            border: t.voiceBorder,
          }}
        >
          <AudioLines size={22} strokeWidth={2.25} />
        </span>
      </div>
    </article>
  );
}

export default function VoiceComposerLabPage() {
  const setA = GUIDED_CHAT_CHROMES.filter((c) => c.set === "A");
  const setB = GUIDED_CHAT_CHROMES.filter((c) => c.set === "B");
  return (
    <main className="vc-lab">
      <div className="vc-lab-intro vc-lab-intro--page">
        <p className="vc-lab-kicker">Design pick</p>
        <h1 className="vc-lab-h1">Voice composer chrome</h1>
        <p className="vc-lab-lead">
          Same catalog as Admin → Platform → Guided chat look. Prefer picking
          there to save for the live app.
        </p>
      </div>

      <section className="vc-lab-section">
        <div className="vc-lab-intro">
          <p className="vc-lab-kicker">Set A · 1–10</p>
          <h2 className="vc-lab-h2">Avatar + Voice</h2>
        </div>
        <div className="vc-lab-grid">
          {setA.map((c) => (
            <ChatMock key={c.id} chrome={c} />
          ))}
        </div>
      </section>

      <section className="vc-lab-section">
        <div className="vc-lab-intro">
          <p className="vc-lab-kicker">Set B · 11–20</p>
          <h2 className="vc-lab-h2">Full chrome</h2>
        </div>
        <div className="vc-lab-grid">
          {setB.map((c) => (
            <ChatMock key={c.id} chrome={c} />
          ))}
        </div>
      </section>
    </main>
  );
}

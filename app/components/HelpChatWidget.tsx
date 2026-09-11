"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, X } from "lucide-react";
import { APP_BASE, LOGIN_PATH } from "@/lib/app-base";

const OPEN_EVENT = "emdr-open-help";
const HELP_KEYBOARD_VAR = "--help-keyboard-inset";

export function openHelpChat() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(OPEN_EVENT));
  }
}

/** Auth / onboarding / active session: no floating FAB. */
function shouldShowFab(pathname: string | null): boolean {
  if (!pathname) return false;
  const hideExact = new Set([APP_BASE, `${APP_BASE}/`]);
  if (hideExact.has(pathname)) return false;

  const hidePrefix = [
    `${APP_BASE}/login`,
    `${APP_BASE}/forgot-password`,
    `${APP_BASE}/reset-password`,
    `${APP_BASE}/create-password`,
    `${APP_BASE}/create-account`,
    `${APP_BASE}/onboarding`,
  ];
  return !hidePrefix.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

type HelpMessage = {
  id: string;
  role: "user" | "assistant" | "admin";
  content: string;
  createdAt: string;
};

type Props = {
  /** Show floating button bottom-right (when path allows). */
  showFab?: boolean;
};

export function HelpChatWidget({ showFab = true }: Props) {
  const pathname = usePathname();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const fabVisible = showFab && shouldShowFab(pathname);
  const [enabled, setEnabled] = useState(true);
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [welcome, setWelcome] = useState("");
  const [messages, setMessages] = useState<HelpMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const scrollToEnd = () => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    });
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setNeedsSignIn(false);
    try {
      const res = await fetch("/api/help/chat");
      const data = await res.json();
      if (!res.ok) {
        setEnabled(false);
        if (res.status === 401) {
          setNeedsSignIn(true);
          setError("");
          return;
        }
        setError(data.error ?? "Help is unavailable");
        return;
      }
      setEnabled(true);
      setWelcome(data.welcomeMessage ?? "");
      setMessages(data.messages ?? []);
      scrollToEnd();
    } catch {
      setError("Could not load help chat");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus();
  }, [open]);

  /** Lift panel above soft keyboard via visualViewport. */
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const sync = () => {
      const vv = window.visualViewport;
      if (!vv) {
        root.style.setProperty(HELP_KEYBOARD_VAR, "0px");
        return;
      }
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      root.style.setProperty(HELP_KEYBOARD_VAR, `${Math.round(inset)}px`);
    };
    sync();
    window.visualViewport?.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("scroll", sync);
    return () => {
      window.visualViewport?.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("scroll", sync);
      root.style.setProperty(HELP_KEYBOARD_VAR, "0px");
    };
  }, [open]);

  /** Marketing hides help ≤768px — close so open state is not stuck invisible. */
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(max-width: 768px)");
    const maybeClose = () => {
      if (mq.matches && document.querySelector(".frontend-home")) {
        setOpen(false);
      }
    };
    maybeClose();
    mq.addEventListener("change", maybeClose);
    return () => mq.removeEventListener("change", maybeClose);
  }, [open]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setError("");
    setDraft("");
    const optimistic: HelpMessage = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    scrollToEnd();
    try {
      const res = await fetch("/api/help/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Send failed");
        setDraft(text);
        setMessages((m) => m.filter((x) => x.id !== optimistic.id));
        if (res.status === 401) {
          setNeedsSignIn(true);
          setEnabled(false);
          setError("");
        }
        return;
      }
      setMessages(data.messages ?? []);
      scrollToEnd();
    } catch {
      setError("Network error");
      setDraft(text);
      setMessages((m) => m.filter((x) => x.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {fabVisible && !open && (
        <button
          type="button"
          className="help-fab"
          onClick={() => setOpen(true)}
          aria-label="Need help"
        >
          <MessageCircle size={20} strokeWidth={2} />
          <span>Need help?</span>
        </button>
      )}

      {open && (
        <div className="help-drawer-root" role="presentation">
          <button
            type="button"
            className="help-drawer-backdrop"
            aria-label="Close help"
            tabIndex={-1}
            onClick={() => setOpen(false)}
          />
          <aside
            className="help-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <header className="help-drawer-head">
              <div>
                <h2 id={titleId} className="help-drawer-title">
                  Need help?
                </h2>
                <p className="help-drawer-sub">Product support chat</p>
              </div>
              <button
                ref={closeBtnRef}
                type="button"
                className="help-drawer-close"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </header>

            <div className="help-drawer-body" ref={listRef}>
              {loading && <p className="help-drawer-muted">Loading…</p>}
              {!loading && needsSignIn && (
                <div className="help-bubble help-bubble-assistant">
                  Sign in to chat with product support about billing, sessions,
                  or your account.
                </div>
              )}
              {!loading && !needsSignIn && welcome && messages.length === 0 && (
                <div className="help-bubble help-bubble-assistant">{welcome}</div>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`help-bubble ${
                    m.role === "user"
                      ? "help-bubble-user"
                      : m.role === "admin"
                        ? "help-bubble-admin"
                        : "help-bubble-assistant"
                  }`}
                >
                  {m.role === "admin" && (
                    <span className="help-bubble-label">Support</span>
                  )}
                  {m.content}
                </div>
              ))}
              {error && <p className="help-drawer-error">{error}</p>}
            </div>

            <footer className="help-drawer-foot">
              {needsSignIn ? (
                <Link href={LOGIN_PATH} className="btn-primary help-drawer-signin">
                  Sign in
                </Link>
              ) : (
                <>
                  <textarea
                    className="help-drawer-input"
                    rows={2}
                    value={draft}
                    disabled={!enabled || sending}
                    placeholder="Ask about billing, sessions, account…"
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void send();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={!enabled || sending || !draft.trim()}
                    onClick={() => void send()}
                  >
                    {sending ? "Sending…" : "Send"}
                  </button>
                </>
              )}
            </footer>
          </aside>
        </div>
      )}
    </>
  );
}

/** Text control that opens the shared help drawer. */
export function HelpChatLink({
  children = "Need help?",
}: {
  children?: ReactNode;
}) {
  return (
    <button type="button" className="help-text-link" onClick={() => openHelpChat()}>
      {children}
    </button>
  );
}

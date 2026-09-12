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
import {
  TurnstileField,
  type TurnstileFieldHandle,
} from "@/app/components/TurnstileField";
import { TURNSTILE_TOKEN_FIELD } from "@/lib/turnstile-shared";

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

type HelpMode = "user" | "guest";

type Props = {
  /** Show floating button bottom-right (when path allows). */
  showFab?: boolean;
};

export function HelpChatWidget({ showFab = true }: Props) {
  const pathname = usePathname();
  const titleId = useId();
  const contactTitleId = useId();
  const [open, setOpen] = useState(false);
  const fabVisible = showFab && shouldShowFab(pathname);
  const [enabled, setEnabled] = useState(true);
  const [mode, setMode] = useState<HelpMode>("user");
  const [adminBlocked, setAdminBlocked] = useState(false);
  const [welcome, setWelcome] = useState("");
  const [messages, setMessages] = useState<HelpMessage[]>([]);
  const [hasContact, setHasContact] = useState(false);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [contactTurnstileToken, setContactTurnstileToken] = useState<
    string | null
  >(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactSaving, setContactSaving] = useState(false);
  const [contactError, setContactError] = useState("");
  const [contactDismissed, setContactDismissed] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const turnstileRef = useRef<TurnstileFieldHandle>(null);
  const contactTurnstileRef = useRef<TurnstileFieldHandle>(null);
  const guestSentRef = useRef(false);

  const scrollToEnd = () => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    });
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setAdminBlocked(false);
    try {
      const res = await fetch("/api/help/chat");
      const data = await res.json();
      if (!res.ok) {
        setEnabled(false);
        if (res.status === 403) {
          setAdminBlocked(true);
          setError(data.error ?? "Help chat is unavailable here.");
          return;
        }
        setError(data.error ?? "Help is unavailable");
        return;
      }
      setEnabled(true);
      setMode(data.mode === "guest" ? "guest" : "user");
      setWelcome(data.welcomeMessage ?? "");
      setMessages(data.messages ?? []);
      setHasContact(Boolean(data.hasContact));
      if (typeof data.guestName === "string" && data.guestName) {
        setContactName(data.guestName);
      }
      if (typeof data.guestEmail === "string" && data.guestEmail) {
        setContactEmail(data.guestEmail);
      }
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
      if (e.key !== "Escape") return;
      if (contactOpen) {
        setContactDismissed(true);
        setContactOpen(false);
        setOpen(false);
        return;
      }
      const needsContact =
        mode === "guest" &&
        !hasContact &&
        !contactDismissed &&
        (messages.length > 0 || guestSentRef.current);
      if (needsContact) {
        setContactOpen(true);
        return;
      }
      setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    open,
    contactOpen,
    mode,
    hasContact,
    messages.length,
    contactDismissed,
  ]);

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

  const shouldPromptContact = () =>
    mode === "guest" &&
    !hasContact &&
    !contactDismissed &&
    (messages.length > 0 || guestSentRef.current);

  const requestClose = () => {
    if (shouldPromptContact()) {
      setContactOpen(true);
      return;
    }
    setOpen(false);
    setContactOpen(false);
  };

  useEffect(() => {
    if (!open || mode !== "guest" || hasContact || contactDismissed) return;

    const needsPrompt = () =>
      messages.length > 0 || guestSentRef.current;

    const onMouseOut = (e: MouseEvent) => {
      if (e.clientY > 16) return;
      if (e.relatedTarget) return;
      if (!needsPrompt()) return;
      setContactOpen(true);
    };

    const onVisibility = () => {
      if (document.visibilityState !== "hidden") return;
      if (!needsPrompt()) return;
      setContactOpen(true);
    };

    document.addEventListener("mouseout", onMouseOut);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("mouseout", onMouseOut);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [open, mode, hasContact, contactDismissed, messages.length]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    if (mode === "guest" && !turnstileToken) {
      setError("Complete the security check, then send.");
      return;
    }
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
      const payload: Record<string, string> = { message: text };
      if (mode === "guest" && turnstileToken) {
        payload[TURNSTILE_TOKEN_FIELD] = turnstileToken;
      }
      const res = await fetch("/api/help/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Send failed");
        setDraft(text);
        setMessages((m) => m.filter((x) => x.id !== optimistic.id));
        turnstileRef.current?.reset();
        setTurnstileToken(null);
        if (res.status === 403) {
          setAdminBlocked(true);
          setEnabled(false);
        }
        return;
      }
      guestSentRef.current = true;
      setMessages(data.messages ?? []);
      if (typeof data.hasContact === "boolean") {
        setHasContact(data.hasContact);
      }
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      scrollToEnd();
    } catch {
      setError("Network error");
      setDraft(text);
      setMessages((m) => m.filter((x) => x.id !== optimistic.id));
      turnstileRef.current?.reset();
      setTurnstileToken(null);
    } finally {
      setSending(false);
    }
  };

  const saveContact = async () => {
    if (contactSaving) return;
    const token =
      contactTurnstileRef.current?.getToken() ?? contactTurnstileToken;
    if (!token) {
      setContactError("Complete the security check first.");
      return;
    }
    setContactSaving(true);
    setContactError("");
    try {
      const res = await fetch("/api/help/guest-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          [TURNSTILE_TOKEN_FIELD]: token,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setContactError(data.error ?? "Could not save");
        contactTurnstileRef.current?.reset();
        setContactTurnstileToken(null);
        return;
      }
      setHasContact(true);
      setContactOpen(false);
      setOpen(false);
    } catch {
      setContactError("Network error");
      contactTurnstileRef.current?.reset();
      setContactTurnstileToken(null);
    } finally {
      setContactSaving(false);
    }
  };

  const dismissContact = () => {
    setContactDismissed(true);
    setContactOpen(false);
    setOpen(false);
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
            onClick={() => requestClose()}
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
                onClick={() => requestClose()}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </header>

            <div className="help-drawer-body" ref={listRef}>
              {loading && <p className="help-drawer-muted">Loading…</p>}
              {!loading && adminBlocked && (
                <div className="help-bubble help-bubble-assistant">
                  {error || "Use Admin → Help for support replies."}
                  <p className="help-drawer-admin-link">
                    <Link href="/admin/help">Open Admin Help</Link>
                  </p>
                </div>
              )}
              {!loading && !adminBlocked && welcome && messages.length === 0 && (
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
              {error && !adminBlocked && (
                <p className="help-drawer-error">{error}</p>
              )}
            </div>

            <footer className="help-drawer-foot">
              {adminBlocked ? (
                <Link href="/admin/help" className="btn-primary help-drawer-signin">
                  Open Admin Help
                </Link>
              ) : (
                <>
                  {mode === "guest" && !hasContact && (
                    <button
                      type="button"
                      className="help-drawer-email-hint"
                      onClick={() => setContactOpen(true)}
                    >
                      Leave your email if you want a reply by mail
                    </button>
                  )}
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
                  {mode === "guest" && (
                    <TurnstileField
                      ref={turnstileRef}
                      action="help-guest"
                      onToken={setTurnstileToken}
                      className="help-drawer-turnstile"
                    />
                  )}
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={
                      !enabled ||
                      sending ||
                      !draft.trim() ||
                      (mode === "guest" && !turnstileToken)
                    }
                    onClick={() => void send()}
                  >
                    {sending ? "Sending…" : "Send"}
                  </button>
                  {mode === "guest" && (
                    <p className="help-drawer-signin-hint">
                      Have an account?{" "}
                      <Link href={LOGIN_PATH}>Sign in</Link>
                    </p>
                  )}
                </>
              )}
            </footer>
          </aside>
        </div>
      )}

      {contactOpen && (
        <div className="help-contact-root" role="presentation">
          <button
            type="button"
            className="help-contact-backdrop"
            aria-label="Dismiss"
            tabIndex={-1}
            onClick={() => dismissContact()}
          />
          <div
            className="help-contact-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={contactTitleId}
          >
            <h3 id={contactTitleId} className="help-contact-title">
              Want a reply by email?
            </h3>
            <p className="help-contact-lead">
              Leave your email and we’ll send a copy of this chat about an hour
              after you’re done, and reply here if you still need us.
            </p>
            <label className="help-contact-label">
              Name
              <input
                className="help-contact-input"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                autoComplete="name"
              />
            </label>
            <label className="help-contact-label">
              Email
              <input
                className="help-contact-input"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                autoComplete="email"
              />
            </label>
            <TurnstileField
              ref={contactTurnstileRef}
              action="help-guest"
              onToken={setContactTurnstileToken}
              className="help-drawer-turnstile"
            />
            {contactError && (
              <p className="help-drawer-error">{contactError}</p>
            )}
            <div className="help-contact-actions">
              <button
                type="button"
                className="btn-primary"
                disabled={
                  contactSaving ||
                  !contactName.trim() ||
                  !contactEmail.trim() ||
                  !contactTurnstileToken
                }
                onClick={() => void saveContact()}
              >
                {contactSaving ? "Saving…" : "Send me a reply by email"}
              </button>
              <button
                type="button"
                className="help-contact-secondary"
                onClick={() => dismissContact()}
              >
                No thanks
              </button>
            </div>
          </div>
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

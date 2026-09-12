"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AdminPageHeader } from "@/app/components/admin/AdminPageHeader";
import { AdminTabs, useAdminTab } from "@/app/components/admin/AdminTabs";
import {
  AdminSettingToggle,
  AdminSettingToggleStack,
} from "@/app/components/admin/AdminSettingToggle";

const TABS = ["inbox", "knowledge", "settings"] as const;
type Tab = (typeof TABS)[number];
const TAB_ITEMS = [
  { id: "inbox", label: "Inbox" },
  { id: "knowledge", label: "Knowledge (RAG)" },
  { id: "settings", label: "Settings" },
] as const;

type Thread = {
  id: string;
  userId?: string | null;
  userEmail?: string;
  userName?: string | null;
  guestName?: string | null;
  guestEmail?: string | null;
  status: string;
  unreadAdmin: boolean;
  lastMessageAt: string;
};

type Message = {
  id: string;
  role: string;
  content: string;
  createdAt: string;
};

type Knowledge = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  enabled: boolean;
};

type Settings = {
  enabled: boolean;
  aiFirstReply: boolean;
  welcomeMessage: string;
  allowedTopics: string;
  deniedTopics: string;
  extraSystemNotes: string;
  notifyAdminsByEmail: boolean;
};

function HelpAdminInner() {
  const params = useSearchParams();
  const [tab, setTab] = useAdminTab(TABS, "inbox");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(
    params.get("thread")
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [knowledge, setKnowledge] = useState<Knowledge[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [doc, setDoc] = useState({
    id: "",
    title: "",
    body: "",
    tags: "",
    enabled: true,
  });

  const loadThreads = useCallback(async () => {
    const res = await fetch("/api/admin/help");
    const data = await res.json();
    if (res.ok) setThreads(data.threads ?? []);
  }, []);

  const loadThread = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/help?threadId=${encodeURIComponent(id)}`);
    const data = await res.json();
    if (res.ok) {
      setMessages(data.messages ?? []);
      setActiveId(id);
      void loadThreads();
    }
  }, [loadThreads]);

  const loadKnowledge = useCallback(async () => {
    const res = await fetch("/api/admin/help?view=knowledge");
    const data = await res.json();
    if (res.ok) setKnowledge(data.knowledge ?? []);
  }, []);

  const loadSettings = useCallback(async () => {
    const res = await fetch("/api/admin/help?view=settings");
    const data = await res.json();
    if (res.ok) setSettings(data.settings);
  }, []);

  useEffect(() => {
    void loadThreads();
    const t = params.get("thread");
    if (t) void loadThread(t);
  }, [loadThreads, loadThread, params]);

  useEffect(() => {
    if (tab === "knowledge") void loadKnowledge();
    if (tab === "settings") void loadSettings();
  }, [tab, loadKnowledge, loadSettings]);

  const sendReply = async () => {
    if (!activeId || !reply.trim()) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reply",
          threadId: activeId,
          message: reply.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error ?? "Reply failed");
        return;
      }
      setMessages(data.messages ?? []);
      setReply("");
      void loadThreads();
    } finally {
      setBusy(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_settings", settings }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error ?? "Save failed");
        return;
      }
      setSettings(data.settings);
      setMsg("Settings saved");
    } finally {
      setBusy(false);
    }
  };

  const saveDoc = async () => {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_knowledge",
          knowledge: {
            id: doc.id || undefined,
            title: doc.title,
            body: doc.body,
            tags: doc.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
            enabled: doc.enabled,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error ?? "Save failed");
        return;
      }
      setDoc({ id: "", title: "", body: "", tags: "", enabled: true });
      void loadKnowledge();
      setMsg("Knowledge saved");
    } finally {
      setBusy(false);
    }
  };

  const removeDoc = async (id: string) => {
    setBusy(true);
    try {
      await fetch("/api/admin/help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_knowledge", knowledgeId: id }),
      });
      void loadKnowledge();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Help chat"
        subtitle="Inbox, knowledge base, and topic settings."
      />

      <main
        className={
          tab === "inbox" ? "admin-main admin-main-wide" : "admin-main"
        }
      >
        <AdminTabs
          tabs={TAB_ITEMS}
          value={tab}
          onChange={(id) => setTab(id as Tab)}
        />

        {msg && <p className="admin-invite-msg">{msg}</p>}

        {tab === "inbox" && (
          <div className="help-admin-grid">
            <div className="admin-panel help-admin-list">
              <h3 className="admin-panel-title">Conversations</h3>
              {threads.length === 0 && (
                <p className="admin-panel-sub">No help chats yet.</p>
              )}
              {threads.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`help-admin-thread ${activeId === t.id ? "help-admin-thread-active" : ""}`}
                  onClick={() => void loadThread(t.id)}
                >
                  <span className="help-admin-thread-email">
                    {t.unreadAdmin ? "● " : ""}
                    {!t.userId ? "Guest · " : ""}
                    {t.userName?.trim() ||
                      t.userEmail?.trim() ||
                      t.guestName?.trim() ||
                      t.guestEmail?.trim() ||
                      "Guest visitor"}
                  </span>
                  <span className="help-admin-thread-meta">
                    {t.status} · {new Date(t.lastMessageAt).toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
            <div className="admin-panel help-admin-thread-view">
              {!activeId && (
                <p className="admin-panel-sub">Select a conversation</p>
              )}
              {activeId && (
                <>
                  <div className="help-admin-messages">
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
                        <span className="help-bubble-label">{m.role}</span>
                        {m.content}
                      </div>
                    ))}
                  </div>
                  <textarea
                    className="field mt-3"
                    rows={3}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Reply as support…"
                  />
                  <div className="admin-modal-actions mt-2">
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={busy}
                      onClick={() =>
                        void fetch("/api/admin/help", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            action: "status",
                            threadId: activeId,
                            status: "resolved",
                          }),
                        }).then(() => loadThreads())
                      }
                    >
                      Resolve
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={busy || !reply.trim()}
                      onClick={() => void sendReply()}
                    >
                      Send reply
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {tab === "knowledge" && (
          <div className="admin-panel">
            <h3 className="admin-panel-title">RAG memory documents</h3>
            <p className="admin-panel-sub">
              The help AI retrieves matching docs when answering. Keep entries
              factual and product-only.
            </p>
            <div className="mt-4 space-y-3">
              <input
                className="field"
                placeholder="Title"
                value={doc.title}
                onChange={(e) =>
                  setDoc((d) => ({ ...d, title: e.target.value }))
                }
              />
              <textarea
                className="field"
                rows={5}
                placeholder="Body"
                value={doc.body}
                onChange={(e) =>
                  setDoc((d) => ({ ...d, body: e.target.value }))
                }
              />
              <input
                className="field"
                placeholder="Tags (comma-separated)"
                value={doc.tags}
                onChange={(e) =>
                  setDoc((d) => ({ ...d, tags: e.target.value }))
                }
              />
              <AdminSettingToggle
                id="help-doc-enabled"
                title="Enabled"
                status={
                  doc.enabled
                    ? "On — AI can retrieve this document"
                    : "Off — kept in the list, not retrieved"
                }
                checked={doc.enabled}
                tone={doc.enabled ? "ok" : "neutral"}
                onChange={(enabled) => setDoc((d) => ({ ...d, enabled }))}
              />
              <button
                type="button"
                className="btn-primary"
                disabled={busy || !doc.title.trim() || !doc.body.trim()}
                onClick={() => void saveDoc()}
              >
                {doc.id ? "Update document" : "Add document"}
              </button>
            </div>

            <ul className="mt-6 space-y-3">
              {knowledge.map((k) => (
                <li key={k.id} className="settings-row flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <strong>{k.title}</strong>
                    {!k.enabled && (
                      <span className="ml-2 text-[12px] text-[var(--text-muted)]">
                        disabled
                      </span>
                    )}
                    <p className="text-[13px] text-[var(--text-secondary)] mt-1">
                      {k.body.slice(0, 160)}
                      {k.body.length > 160 ? "…" : ""}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() =>
                        setDoc({
                          id: k.id,
                          title: k.title,
                          body: k.body,
                          tags: k.tags.join(", "),
                          enabled: k.enabled,
                        })
                      }
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-ghost text-[var(--destructive)]"
                      onClick={() => void removeDoc(k.id)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === "settings" && settings && (
          <div className="admin-panel">
            <div className="settings-group">
              <AdminSettingToggleStack>
                <AdminSettingToggle
                  id="help-chat-enabled"
                  title="Help chat"
                  status={
                    settings.enabled
                      ? "On — Need help? appears in the app"
                      : "Off — widget is hidden"
                  }
                  checked={settings.enabled}
                  tone={settings.enabled ? "ok" : "neutral"}
                  onChange={(enabled) =>
                    setSettings({ ...settings, enabled })
                  }
                />
                <AdminSettingToggle
                  id="help-ai-first"
                  title="AI first reply"
                  status={
                    settings.aiFirstReply
                      ? "On — AI answers from knowledge first"
                      : "Off — new threads wait for a human"
                  }
                  checked={settings.aiFirstReply}
                  tone={settings.aiFirstReply ? "ok" : "neutral"}
                  onChange={(aiFirstReply) =>
                    setSettings({ ...settings, aiFirstReply })
                  }
                />
                <AdminSettingToggle
                  id="help-email-admins"
                  title="Email admins"
                  status={
                    settings.notifyAdminsByEmail
                      ? "On — email on each new help message"
                      : "Off — inbox only, no email"
                  }
                  checked={settings.notifyAdminsByEmail}
                  tone={settings.notifyAdminsByEmail ? "ok" : "neutral"}
                  onChange={(notifyAdminsByEmail) =>
                    setSettings({ ...settings, notifyAdminsByEmail })
                  }
                />
              </AdminSettingToggleStack>
            </div>
            <label className="mt-4 block text-[13px] font-medium">
              Welcome message
            </label>
            <textarea
              className="field mt-1"
              rows={3}
              value={settings.welcomeMessage}
              onChange={(e) =>
                setSettings({ ...settings, welcomeMessage: e.target.value })
              }
            />
            <label className="mt-4 block text-[13px] font-medium">
              Allowed topics
            </label>
            <textarea
              className="field mt-1"
              rows={4}
              value={settings.allowedTopics}
              onChange={(e) =>
                setSettings({ ...settings, allowedTopics: e.target.value })
              }
            />
            <label className="mt-4 block text-[13px] font-medium">
              Must not discuss
            </label>
            <textarea
              className="field mt-1"
              rows={4}
              value={settings.deniedTopics}
              onChange={(e) =>
                setSettings({ ...settings, deniedTopics: e.target.value })
              }
            />
            <label className="mt-4 block text-[13px] font-medium">
              Extra system notes
            </label>
            <textarea
              className="field mt-1"
              rows={3}
              value={settings.extraSystemNotes}
              onChange={(e) =>
                setSettings({ ...settings, extraSystemNotes: e.target.value })
              }
            />
            <button
              type="button"
              className="btn-primary mt-4"
              disabled={busy}
              onClick={() => void saveSettings()}
            >
              Save settings
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AdminHelpPage() {
  return (
    <Suspense
      fallback={
        <div className="admin-page flex min-h-screen items-center justify-center">
          <p className="text-[var(--text-secondary)]">Loading…</p>
        </div>
      }
    >
      <HelpAdminInner />
    </Suspense>
  );
}

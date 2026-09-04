"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/app/components/admin/AdminPageHeader";
import { formatDateTime } from "@/lib/admin-format";
import type { EmailEvent } from "@/lib/email-events";
import type { EmailTemplateId } from "@/lib/email/templates";
import type { PlatformSettings } from "@/lib/platform-settings";
import { fetchJson } from "@/lib/fetch-json";
import { BroadcastForm, TemplateEditor } from "@/app/components/admin/EmailTools";

type Tab = "settings" | "templates" | "log";

type HealthStatus = {
  brevoConfigured: boolean;
  gmailFallbackConfigured: boolean;
  appUrl: string;
  fromAddress: string | null;
  fromName: string | null;
};

const TEMPLATE_IDS: EmailTemplateId[] = [
  "password_reset",
  "welcome_invite",
  "password_changed",
  "welcome",
];

export default function AdminEmailPage() {
  const [tab, setTab] = useState<Tab>("settings");
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [templates, setTemplates] = useState<
    {
      id: EmailTemplateId;
      subject: string;
      html: string;
      text: string;
      isCustom: boolean;
    }[]
  >([]);
  const [events, setEvents] = useState<EmailEvent[]>([]);
  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplateId>("welcome");
  const [previewHtml, setPreviewHtml] = useState("");
  const [testTo, setTestTo] = useState("");
  const [testTemplate, setTestTemplate] =
    useState<EmailTemplateId>("welcome");
  const [logStatus, setLogStatus] = useState<"all" | "sent" | "failed">("all");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [healthRes, platformRes, templatesRes] = await Promise.all([
      fetchJson<{ status: HealthStatus }>("/api/admin/email/status"),
      fetchJson<{ settings: PlatformSettings }>("/api/admin/platform"),
      fetchJson<{
        templates: {
          id: EmailTemplateId;
          subject: string;
          html: string;
          text: string;
          isCustom: boolean;
        }[];
      }>("/api/admin/email/templates"),
    ]);
    setHealth(healthRes.status);
    setSettings(platformRes.settings);
    setTemplates(templatesRes.templates ?? []);
    const current =
      templatesRes.templates?.find((t) => t.id === selectedTemplate) ??
      templatesRes.templates?.[0];
    if (current) {
      setPreviewHtml(current.html);
      setSelectedTemplate(current.id);
    }
  }, [selectedTemplate]);

  const loadLog = useCallback(async () => {
    const params = new URLSearchParams({ limit: "50" });
    if (logStatus !== "all") params.set("status", logStatus);
    const res = await fetchJson<{ events: EmailEvent[] }>(
      `/api/admin/email/events?${params.toString()}`
    );
    setEvents(res.events ?? []);
  }, [logStatus]);

  useEffect(() => {
    void (async () => {
      try {
        await load();
        await loadLog();
      } finally {
        setLoading(false);
      }
    })();
  }, [load, loadLog]);

  useEffect(() => {
    const t = templates.find((x) => x.id === selectedTemplate);
    if (t) setPreviewHtml(t.html);
  }, [selectedTemplate, templates]);

  const saveSender = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setBusy(true);
    setMsg("");
    try {
      await fetchJson("/api/admin/platform", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settings,
          fromName: settings.fromName,
          fromAddress: settings.fromAddress,
        }),
      });
      setMsg("Sender settings saved.");
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const sendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      await fetchJson("/api/admin/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testTo, templateId: testTemplate }),
      });
      setMsg("Test email sent.");
      await loadLog();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Send failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page flex min-h-screen items-center justify-center">
        <p className="text-[var(--text-secondary)]">Loading…</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Email"
        subtitle="Delivery status, sender identity, templates, and send log."
      />
      <main className="admin-main">
        <div className="admin-tabs">
          {(["settings", "templates", "log"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`admin-tab ${tab === t ? "admin-tab-active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "settings" ? "Settings" : t === "templates" ? "Templates" : "Log"}
            </button>
          ))}
        </div>

        {tab === "settings" && health && settings && (
          <>
            <section className="admin-panel">
              <h2 className="admin-panel-title">Delivery</h2>
              <div className="admin-health-chips">
                <span
                  className={`admin-health-chip ${
                    health.brevoConfigured ? "admin-health-ok" : "admin-health-warn"
                  }`}
                >
                  Brevo {health.brevoConfigured ? "configured" : "not configured"}
                </span>
                <span
                  className={`admin-health-chip ${
                    health.gmailFallbackConfigured
                      ? "admin-health-ok"
                      : "admin-health-warn"
                  }`}
                >
                  Gmail fallback{" "}
                  {health.gmailFallbackConfigured ? "ready" : "not configured"}
                </span>
              </div>
              <p className="admin-panel-sub">
                API keys stay in environment variables (.env). This panel never stores secrets.
              </p>
            </section>

            <section className="admin-panel">
              <h2 className="admin-panel-title">Sender</h2>
              <form className="admin-form-stack" onSubmit={(e) => void saveSender(e)}>
                <label className="admin-field-label">
                  From name
                  <input
                    type="text"
                    value={settings.fromName}
                    onChange={(e) =>
                      setSettings({ ...settings, fromName: e.target.value })
                    }
                    className="field"
                    placeholder="EMDR Guide"
                  />
                </label>
                <label className="admin-field-label">
                  From address
                  <input
                    type="email"
                    value={settings.fromAddress}
                    onChange={(e) =>
                      setSettings({ ...settings, fromAddress: e.target.value })
                    }
                    className="field"
                    placeholder="hello@example.com"
                  />
                </label>
                <button type="submit" disabled={busy} className="btn-primary w-fit">
                  {busy ? "Saving…" : "Save sender"}
                </button>
              </form>
            </section>

            <section className="admin-panel">
              <h2 className="admin-panel-title">Test send</h2>
              <form className="admin-invite-form" onSubmit={(e) => void sendTest(e)}>
                <input
                  type="email"
                  required
                  placeholder="Send test to"
                  value={testTo}
                  onChange={(e) => setTestTo(e.target.value)}
                  className="field"
                />
                <select
                  value={testTemplate}
                  onChange={(e) =>
                    setTestTemplate(e.target.value as EmailTemplateId)
                  }
                  className="field"
                >
                  {TEMPLATE_IDS.map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </select>
                <button type="submit" disabled={busy} className="btn-primary shrink-0">
                  {busy ? "Sending…" : "Send test"}
                </button>
              </form>
            </section>
            <section className="admin-panel">
              <h2 className="admin-panel-title">Broadcast</h2>
              <p className="admin-panel-sub">
                Send a one-off announcement to all active users.
              </p>
              <BroadcastForm
                onSent={async (sent) => {
                  setMsg(`Broadcast sent to ${sent} users.`);
                  await loadLog();
                }}
              />
            </section>
          </>
        )}

        {tab === "templates" && (
          <section className="admin-panel">
            <h2 className="admin-panel-title">Template preview & editor</h2>
            <div className="admin-template-picker">
              {TEMPLATE_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={`admin-tab ${selectedTemplate === id ? "admin-tab-active" : ""}`}
                  onClick={() => setSelectedTemplate(id)}
                >
                  {id}
                </button>
              ))}
            </div>
            {templates.find((t) => t.id === selectedTemplate) && (
              <TemplateEditor
                template={templates.find((t) => t.id === selectedTemplate)!}
                onSaved={async () => {
                  await load();
                  setMsg("Template saved.");
                }}
              />
            )}
            <iframe
              title="Email preview"
              className="admin-email-preview"
              srcDoc={previewHtml}
            />
          </section>
        )}

        {tab === "log" && (
          <section className="admin-panel">
            <div className="admin-filters">
              <select
                value={logStatus}
                onChange={(e) =>
                  setLogStatus(e.target.value as "all" | "sent" | "failed")
                }
                className="field admin-filter-field"
              >
                <option value="all">All</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
              </select>
              <button
                type="button"
                className="btn-secondary shrink-0"
                onClick={() => void loadLog()}
              >
                Refresh
              </button>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>To</th>
                    <th>Template</th>
                    <th>Provider</th>
                    <th>Status</th>
                    <th>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {events.length === 0 && (
                    <tr>
                      <td colSpan={6} className="admin-table-empty">
                        No email events yet
                      </td>
                    </tr>
                  )}
                  {events.map((ev) => (
                    <tr key={ev.id}>
                      <td>{formatDateTime(ev.createdAt)}</td>
                      <td>{ev.toEmail}</td>
                      <td>{ev.templateId ?? "—"}</td>
                      <td>{ev.provider ?? "—"}</td>
                      <td>{ev.status}</td>
                      <td className="text-[var(--text-muted)]">
                        {ev.error ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {msg && <p className="admin-invite-msg">{msg}</p>}
      </main>
    </div>
  );
}

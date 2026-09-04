"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/app/components/admin/AdminPageHeader";
import type { PlatformSettings } from "@/lib/platform-settings";
import { fetchJson } from "@/lib/fetch-json";

export default function AdminPlatformPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetchJson<{ settings: PlatformSettings }>(
      "/api/admin/platform"
    );
    setSettings(res.settings);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await load();
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setBusy(true);
    setMsg("");
    try {
      await fetchJson("/api/admin/platform", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setMsg("Platform settings saved.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="admin-page flex min-h-screen items-center justify-center">
        <p className="text-[var(--text-secondary)]">Loading…</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Platform"
        subtitle="Site identity, invites, maintenance, feature flags, and agent protocol notes."
      />
      <main className="admin-main">
        <form className="admin-form-stack admin-panel" onSubmit={(e) => void save(e)}>
          <h2 className="admin-panel-title">General</h2>
          <label className="admin-field-label">
            Site name
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) =>
                setSettings({ ...settings, siteName: e.target.value })
              }
              className="field"
            />
          </label>
          <label className="admin-field-label">
            Support email
            <input
              type="email"
              value={settings.supportEmail}
              onChange={(e) =>
                setSettings({ ...settings, supportEmail: e.target.value })
              }
              className="field"
            />
          </label>
          <label className="admin-field-label">
            Public app URL
            <input
              type="url"
              value={settings.publicAppUrl}
              onChange={(e) =>
                setSettings({ ...settings, publicAppUrl: e.target.value })
              }
              className="field"
              placeholder="https://app.example.com"
            />
          </label>
          <p className="admin-panel-sub">
            Used in email links when set. Falls back to APP_URL env.
          </p>

          <h2 className="admin-panel-title mt-4">Access</h2>
          <label className="admin-toggle-row">
            <span>Invites enabled</span>
            <input
              type="checkbox"
              checked={settings.invitesEnabled}
              onChange={(e) =>
                setSettings({ ...settings, invitesEnabled: e.target.checked })
              }
            />
          </label>
          <label className="admin-field-label">
            Maintenance message
            <textarea
              value={settings.maintenanceMessage}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maintenanceMessage: e.target.value,
                })
              }
              className="field admin-textarea"
              placeholder="Leave empty to disable maintenance mode"
              rows={3}
            />
          </label>

          <h2 className="admin-panel-title mt-4">Feature flags</h2>
          <label className="admin-toggle-row">
            <span>Voice</span>
            <input
              type="checkbox"
              checked={settings.flags.voice}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  flags: { ...settings.flags, voice: e.target.checked },
                })
              }
            />
          </label>
          <label className="admin-toggle-row">
            <span>Memory</span>
            <input
              type="checkbox"
              checked={settings.flags.memory}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  flags: { ...settings.flags, memory: e.target.checked },
                })
              }
            />
          </label>
          <label className="admin-toggle-row">
            <span>BLS vibration</span>
            <input
              type="checkbox"
              checked={settings.flags.blsVibration}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  flags: {
                    ...settings.flags,
                    blsVibration: e.target.checked,
                  },
                })
              }
            />
          </label>
          <label className="admin-toggle-row">
            <span>Session interpreter (JSON phase/SUDs/VoC)</span>
            <input
              type="checkbox"
              checked={settings.flags.sessionInterpreter !== false}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  flags: {
                    ...settings.flags,
                    sessionInterpreter: e.target.checked,
                  },
                })
              }
            />
          </label>

          <h2 className="admin-panel-title mt-4">Agent protocol notes</h2>
          <p className="admin-panel-sub">
            Extra instructions appended to the EMDR guide system prompt
            (max 4000 chars). Base knowledge lives in code (
            <code>lib/protocol-knowledge.ts</code>).
          </p>
          <label className="admin-field-label">
            Knowledge notes
            <textarea
              value={settings.agentKnowledgeNotes ?? ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  agentKnowledgeNotes: e.target.value.slice(0, 4000),
                })
              }
              className="field admin-textarea"
              rows={8}
              placeholder="e.g. Prefer Serbian greetings only on first message… Prefer shorter sets for new users…"
            />
          </label>
          <p className="admin-panel-sub">
            {(settings.agentKnowledgeNotes ?? "").length}/4000
          </p>

          <button type="submit" disabled={busy} className="btn-primary w-fit">
            {busy ? "Saving…" : "Save platform settings"}
          </button>
          {msg && <p className="admin-invite-msg">{msg}</p>}
        </form>
      </main>
    </div>
  );
}

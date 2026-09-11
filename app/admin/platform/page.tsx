"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/app/components/admin/AdminPageHeader";
import { AdminTabs, useAdminTab } from "@/app/components/admin/AdminTabs";
import type { PlatformSettings } from "@/lib/platform-settings";
import { fetchJson } from "@/lib/fetch-json";

const TABS = ["general", "access", "features", "ads", "agent"] as const;
type Tab = (typeof TABS)[number];
const TAB_ITEMS = [
  { id: "general", label: "General" },
  { id: "access", label: "Access" },
  { id: "features", label: "Features" },
  { id: "ads", label: "Ads" },
  { id: "agent", label: "Agent" },
] as const;

function AdminPlatformPageInner() {
  const [tab, setTab] = useAdminTab(TABS, "general");
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
        subtitle="Site identity, invites, maintenance, feature flags, ads, and agent protocol notes."
      />
      <main className="admin-main">
        <AdminTabs
          tabs={TAB_ITEMS}
          value={tab}
          onChange={(id) => setTab(id as Tab)}
        />

        <form className="admin-form-stack admin-panel" onSubmit={(e) => void save(e)}>
          {tab === "general" && (
            <>
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
              <p className="admin-panel-sub">
                Spoken name shown in the app (Nura). Legal lockup is NuraHelp.
              </p>
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
                  placeholder="https://dev.nurahelp.com"
                />
              </label>
              <p className="admin-panel-sub">
                Used in email links when set. Falls back to APP_URL env.
              </p>
            </>
          )}

          {tab === "access" && (
            <>
              <h2 className="admin-panel-title">Access</h2>
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
            </>
          )}

          {tab === "features" && (
            <>
              <h2 className="admin-panel-title">Feature flags</h2>
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
                <span>Controller rumble</span>
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
            </>
          )}

          {tab === "ads" && (
            <>
              <h2 className="admin-panel-title">Ads (free / trial)</h2>
              <p className="admin-panel-sub">
                Interstitial before a Free session set, plus in-page display on
                Resources for trial users. Paying users never see ads. Frequency
                applies to the Free-session interstitial only.
              </p>
              <label className="admin-toggle-row">
                <span>Enable ads</span>
                <input
                  type="checkbox"
                  checked={settings.ads?.enabled === true}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      ads: { ...settings.ads, enabled: e.target.checked },
                    })
                  }
                />
              </label>
              <label className="admin-field-label">
                Provider
                <select
                  className="field"
                  value={settings.ads?.provider ?? "placeholder"}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      ads: {
                        ...settings.ads,
                        provider: e.target.value as
                          | "placeholder"
                          | "adsense"
                          | "gam",
                      },
                    })
                  }
                >
                  <option value="placeholder">Placeholder (dev)</option>
                  <option value="adsense">Google AdSense</option>
                  <option value="gam">Google Ad Manager (video — soon)</option>
                </select>
              </label>
              {(settings.ads?.provider ?? "placeholder") === "adsense" && (
                <>
                  <label className="admin-field-label">
                    AdSense client ID
                    <input
                      type="text"
                      className="field"
                      value={settings.ads?.adsenseClient ?? ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          ads: {
                            ...settings.ads,
                            adsenseClient: e.target.value,
                          },
                        })
                      }
                      placeholder="ca-pub-xxxxxxxxxxxxxxxx"
                    />
                  </label>
                  <label className="admin-field-label">
                    Interstitial ad slot
                    <input
                      type="text"
                      className="field"
                      value={settings.ads?.adsenseSlot ?? ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          ads: {
                            ...settings.ads,
                            adsenseSlot: e.target.value,
                          },
                        })
                      }
                      placeholder="1234567890"
                    />
                  </label>
                  <label className="admin-field-label">
                    Resources display ad slot
                    <input
                      type="text"
                      className="field"
                      value={settings.ads?.adsenseDisplaySlot ?? ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          ads: {
                            ...settings.ads,
                            adsenseDisplaySlot: e.target.value,
                          },
                        })
                      }
                      placeholder="1234567890"
                    />
                  </label>
                  <p className="admin-panel-sub">
                    Required for Resources in-page ads. Create a separate display
                    unit in AdSense — do not reuse the interstitial slot.
                  </p>
                </>
              )}
              <label className="admin-field-label">
                Frequency
                <select
                  className="field"
                  value={settings.ads?.frequencyMode ?? "per_session"}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      ads: {
                        ...settings.ads,
                        frequencyMode: e.target.value as
                          | "per_session"
                          | "every_minutes"
                          | "every_n_sets"
                          | "per_set",
                      },
                    })
                  }
                >
                  <option value="per_session">Once per browser session</option>
                  <option value="every_minutes">Every N minutes</option>
                  <option value="every_n_sets">
                    After every N completed sets (first N starts are ad-free)
                  </option>
                  <option value="per_set">Every set</option>
                </select>
              </label>
              {(settings.ads?.frequencyMode ?? "per_session") ===
                "every_n_sets" && (
                <p className="admin-panel-sub">
                  Counts completed Free session sets. Example N=3: sets 1–3 free, ad
                  before set 4, then again after 3 more, and so on.
                </p>
              )}
              {(settings.ads?.frequencyMode ?? "per_session") ===
                "every_minutes" && (
                <label className="admin-field-label">
                  Every N minutes
                  <input
                    type="number"
                    className="field"
                    min={1}
                    max={120}
                    value={settings.ads?.everyMinutes ?? 5}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        ads: {
                          ...settings.ads,
                          everyMinutes: Number(e.target.value) || 5,
                        },
                      })
                    }
                  />
                </label>
              )}
              {(settings.ads?.frequencyMode ?? "per_session") ===
                "every_n_sets" && (
                <label className="admin-field-label">
                  Every N sets
                  <input
                    type="number"
                    className="field"
                    min={1}
                    max={50}
                    value={settings.ads?.everyNSets ?? 3}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        ads: {
                          ...settings.ads,
                          everyNSets: Number(e.target.value) || 3,
                        },
                      })
                    }
                  />
                </label>
              )}
              <label className="admin-field-label">
                Minimum watch seconds before Continue
                <input
                  type="number"
                  className="field"
                  min={0}
                  max={60}
                  value={settings.ads?.minWatchSeconds ?? 5}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      ads: {
                        ...settings.ads,
                        minWatchSeconds: Number(e.target.value) || 0,
                      },
                    })
                  }
                />
              </label>
            </>
          )}

          {tab === "agent" && (
            <>
              <h2 className="admin-panel-title">Agent protocol notes</h2>
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
            </>
          )}

          <button type="submit" disabled={busy} className="btn-primary w-fit">
            {busy ? "Saving…" : "Save platform settings"}
          </button>
          {msg && <p className="admin-invite-msg">{msg}</p>}
        </form>
      </main>
    </div>
  );
}

export default function AdminPlatformPage() {
  return (
    <Suspense
      fallback={
        <div className="admin-page flex min-h-screen items-center justify-center">
          <p className="text-[var(--text-secondary)]">Loading…</p>
        </div>
      }
    >
      <AdminPlatformPageInner />
    </Suspense>
  );
}

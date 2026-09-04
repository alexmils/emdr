"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppleToggle } from "@/app/components/AppleToggle";
import { PasskeySettings } from "@/app/components/PasskeySettings";
import { Avatar } from "@/app/components/Avatar";
import {
  displayNameFor,
  notifyUserUpdated,
  useCurrentUser,
} from "@/app/components/useCurrentUser";
import { fileToAvatarDataUrl } from "@/lib/avatar-client";
import type { AppSettings, Memory, MemorySet } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/types";

type SettingsTab = "profile" | "voice" | "memory" | "security" | "coming-soon";

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "voice", label: "Voice" },
  { id: "memory", label: "Memory" },
  { id: "security", label: "Security" },
  { id: "coming-soon", label: "Coming soon" },
];

function isSettingsTab(value: string | null): value is SettingsTab {
  return (
    value === "profile" ||
    value === "voice" ||
    value === "memory" ||
    value === "security" ||
    value === "coming-soon"
  );
}

function SettingsPageContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [tab, setTab] = useState<SettingsTab>(
    isSettingsTab(tabParam) ? tabParam : "profile"
  );
  const { user, refresh: refreshUser } = useCurrentUser();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [memorySets, setMemorySets] = useState<MemorySet[]>([]);
  const [newMemTitle, setNewMemTitle] = useState("");
  const [newMemBody, setNewMemBody] = useState("");
  const [newSetName, setNewSetName] = useState("");
  const [addToSetId, setAddToSetId] = useState("");
  const [addMemId, setAddMemId] = useState("");
  const [profileName, setProfileName] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProfileName(user?.name ?? "");
  }, [user?.name]);

  const load = async () => {
    const res = await fetch("/api/settings");
    const data = await res.json();
    setSettings(data.settings ?? DEFAULT_SETTINGS);
    setMemories(data.memories ?? []);
    setMemorySets(data.memorySets ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (isSettingsTab(tabParam)) setTab(tabParam);
  }, [tabParam]);

  const save = async (next: AppSettings) => {
    setSettings(next);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save_settings", settings: next }),
    });
  };

  const saveProfile = async () => {
    setProfileSaving(true);
    setProfileError(null);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profileName.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save");
      notifyUserUpdated();
      await refreshUser();
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setProfileSaving(false);
    }
  };

  const onAvatarFile = async (file: File | null) => {
    if (!file) return;
    setAvatarBusy(true);
    setProfileError(null);
    try {
      const avatarUrl = await fileToAvatarDataUrl(file);
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not upload");
      notifyUserUpdated();
      await refreshUser();
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setAvatarBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeAvatar = async () => {
    setAvatarBusy(true);
    setProfileError(null);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: null }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Could not remove");
      }
      notifyUserUpdated();
      await refreshUser();
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setAvatarBusy(false);
    }
  };

  const panelTitle = TABS.find((t) => t.id === tab)?.label ?? "Settings";
  const label = displayNameFor(user);

  return (
    <div className="settings-shell">
      <aside className="settings-sidebar">
        <Link
          href="/"
          className="mb-4 block px-2 text-[13px] font-medium text-[var(--accent)] hover:underline"
        >
          ← Back
        </Link>
        <p className="text-headline mb-4 px-2">Settings</p>
        <nav>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`settings-nav-item ${
                tab === t.id ? "settings-nav-item-active" : ""
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="settings-panel">
        <h2 className="settings-panel-title">{panelTitle}</h2>

        {tab === "profile" && (
          <div className="settings-group">
            <div className="settings-row flex flex-wrap items-center gap-4">
              <Avatar
                src={user?.avatarUrl}
                alt={label}
                fallback={label}
                className="avatar-lg"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium">Profile photo</p>
                <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
                  Shown in chat and the sidebar. JPG, PNG, or WebP.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) =>
                      void onAvatarFile(e.target.files?.[0] ?? null)
                    }
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={avatarBusy}
                    onClick={() => fileRef.current?.click()}
                  >
                    {avatarBusy ? "Uploading…" : "Upload photo"}
                  </button>
                  {user?.avatarUrl && (
                    <button
                      type="button"
                      className="btn-ghost"
                      disabled={avatarBusy}
                      onClick={() => void removeAvatar()}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
            <label className="settings-row block">
              <span className="mb-2 block text-[12px] font-medium text-[var(--text-secondary)]">
                Display name
              </span>
              <input
                className="field"
                value={profileName}
                placeholder="Your name"
                maxLength={80}
                onChange={(e) => setProfileName(e.target.value)}
              />
            </label>
            <div className="settings-row flex items-center justify-between gap-2">
              <p className="text-[12px] text-[var(--text-muted)]">
                {user?.email}
              </p>
              <button
                type="button"
                className="btn-primary"
                disabled={profileSaving}
                onClick={() => void saveProfile()}
              >
                {profileSaving ? "Saving…" : "Save profile"}
              </button>
            </div>
            {profileError && (
              <p className="settings-row text-[13px] text-[var(--destructive)]">
                {profileError}
              </p>
            )}
          </div>
        )}

        {tab === "voice" && (
          <div className="settings-group">
            <div className="settings-row settings-toggle-row">
              <div className="min-w-0 flex-1">
                <span className="text-[13px] font-medium">Auto voice</span>
                <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                  Automatically read each agent line aloud (not during BLS).
                  Use the speaker icon on each message when off. Voice provider
                  is configured by the platform admin.
                </p>
              </div>
              <AppleToggle
                label="Auto voice"
                checked={settings.autoVoice}
                onChange={(autoVoice) => void save({ ...settings, autoVoice })}
              />
            </div>
          </div>
        )}

        {tab === "memory" && (
          <div className="settings-group">
            <div className="settings-row space-y-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  placeholder="Memory title"
                  className="field"
                  value={newMemTitle}
                  onChange={(e) => setNewMemTitle(e.target.value)}
                />
                <input
                  placeholder="Memory text"
                  className="field"
                  value={newMemBody}
                  onChange={(e) => setNewMemBody(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={async () => {
                  await fetch("/api/settings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      action: "create_memory",
                      title: newMemTitle,
                      body: newMemBody,
                    }),
                  });
                  setNewMemTitle("");
                  setNewMemBody("");
                  void load();
                }}
              >
                New memory
              </button>
            </div>
            <div className="settings-row flex flex-wrap gap-2">
              <input
                placeholder="New set name"
                className="field min-w-[10rem] flex-1"
                value={newSetName}
                onChange={(e) => setNewSetName(e.target.value)}
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={async () => {
                  await fetch("/api/settings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      action: "create_set",
                      name: newSetName,
                    }),
                  });
                  setNewSetName("");
                  void load();
                }}
              >
                New set
              </button>
            </div>
            <div className="settings-row flex flex-wrap gap-2">
              <select
                className="field !w-auto min-w-[8rem]"
                value={addToSetId}
                onChange={(e) => setAddToSetId(e.target.value)}
              >
                <option value="">Set…</option>
                {memorySets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <select
                className="field !w-auto min-w-[8rem]"
                value={addMemId}
                onChange={(e) => setAddMemId(e.target.value)}
              >
                <option value="">Memory…</option>
                {memories.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn-primary"
                disabled={!addToSetId || !addMemId}
                onClick={async () => {
                  await fetch("/api/settings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      action: "add_to_set",
                      setId: addToSetId,
                      memoryId: addMemId,
                    }),
                  });
                  void load();
                }}
              >
                Add to set
              </button>
            </div>
            {memorySets.map((set) => (
              <div key={set.id} className="settings-row">
                <p className="text-[13px] font-semibold">{set.name}</p>
                <ul className="mt-1 space-y-0.5 text-[12px] text-[var(--text-secondary)]">
                  {set.memoryIds.map((mid) => {
                    const m = memories.find((x) => x.id === mid);
                    return m ? <li key={mid}>{m.title}</li> : null;
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}

        {tab === "security" && <PasskeySettings />}

        {tab === "coming-soon" && (
          <div className="apple-card border-dashed p-5 opacity-80">
            <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">
              Additional personalization options will be added in a future
              release.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsPageContent />
    </Suspense>
  );
}

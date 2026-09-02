"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppleToggle } from "@/app/components/AppleToggle";
import type { AppSettings, Memory, MemorySet } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/types";

type SettingsTab = "voice" | "ai" | "elevenlabs" | "memory" | "coming-soon";

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "voice", label: "Voice" },
  { id: "ai", label: "AI" },
  { id: "elevenlabs", label: "ElevenLabs" },
  { id: "memory", label: "Memory" },
  { id: "coming-soon", label: "Coming soon" },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>("voice");
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [memorySets, setMemorySets] = useState<MemorySet[]>([]);
  const [newMemTitle, setNewMemTitle] = useState("");
  const [newMemBody, setNewMemBody] = useState("");
  const [newSetName, setNewSetName] = useState("");
  const [addToSetId, setAddToSetId] = useState("");
  const [addMemId, setAddMemId] = useState("");

  const load = async () => {
    const res = await fetch("/api/settings");
    const data = await res.json();
    setSettings(data.settings);
    setMemories(data.memories);
    setMemorySets(data.memorySets);
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async (next: AppSettings) => {
    setSettings(next);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save_settings", settings: next }),
    });
  };

  const panelTitle = TABS.find((t) => t.id === tab)?.label ?? "Settings";

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

        {tab === "voice" && (
          <div className="settings-group">
            <div className="settings-row settings-toggle-row">
              <div className="min-w-0 flex-1">
                <span className="text-[13px] font-medium">Auto voice</span>
                <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                  ElevenLabs reads each agent line automatically (not during
                  BLS). Use the speaker icon on each message when off.
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

        {tab === "ai" && (
          <div className="settings-group">
            <div className="settings-row flex items-center justify-between gap-3">
              <span className="text-[13px]">Default provider</span>
              <select
                className="field !w-auto !py-1.5 text-[13px]"
                value={settings.defaultAiProvider}
                onChange={(e) =>
                  void save({
                    ...settings,
                    defaultAiProvider: e.target
                      .value as AppSettings["defaultAiProvider"],
                  })
                }
              >
                <option value="deepseek">DeepSeek</option>
                <option value="openai">OpenAI</option>
                <option value="claude">Claude</option>
              </select>
            </div>
            {(["deepseek", "openai", "claude"] as const).map((p) => (
              <div key={p} className="settings-row space-y-2">
                <h3 className="text-[13px] font-semibold capitalize">{p}</h3>
                <input
                  type="password"
                  placeholder="API key"
                  className="field"
                  value={settings.connectors[p].apiKey}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      connectors: {
                        ...settings.connectors,
                        [p]: {
                          ...settings.connectors[p],
                          apiKey: e.target.value,
                        },
                      },
                    })
                  }
                />
                <input
                  className="field"
                  placeholder="Model"
                  value={settings.connectors[p].model}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      connectors: {
                        ...settings.connectors,
                        [p]: {
                          ...settings.connectors[p],
                          model: e.target.value,
                        },
                      },
                    })
                  }
                />
                <button
                  type="button"
                  className="text-[13px] font-medium text-[var(--accent)]"
                  onClick={() => void save(settings)}
                >
                  Save {p}
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === "elevenlabs" && (
          <div className="settings-group">
            <div className="settings-row space-y-2">
              <p className="text-[12px] text-[var(--text-secondary)]">
                Text-to-speech for agent lines and auto voice.
              </p>
              <input
                type="password"
                placeholder="API key"
                className="field"
                value={settings.connectors.elevenlabs.apiKey}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    connectors: {
                      ...settings.connectors,
                      elevenlabs: {
                        ...settings.connectors.elevenlabs,
                        apiKey: e.target.value,
                      },
                    },
                  })
                }
              />
              <input
                placeholder="Voice ID"
                className="field"
                value={settings.connectors.elevenlabs.voiceId}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    connectors: {
                      ...settings.connectors,
                      elevenlabs: {
                        ...settings.connectors.elevenlabs,
                        voiceId: e.target.value,
                      },
                    },
                  })
                }
              />
              <button
                type="button"
                className="btn-primary"
                onClick={() => void save(settings)}
              >
                Save ElevenLabs
              </button>
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

        {tab === "coming-soon" && (
          <div className="apple-card border-dashed p-5 opacity-80">
            <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">
              Gemini, Azure OpenAI, local models, and additional voice
              providers will be added in a future release.
            </p>
          </div>
        )}

        <p className="mt-10 text-[11px] leading-relaxed text-[var(--text-secondary)]">
          Disclaimer: This is a self-help guide, not a substitute for a licensed
          therapist. If you feel overwhelmed, stop and seek professional
          support.
        </p>
      </main>
    </div>
  );
}

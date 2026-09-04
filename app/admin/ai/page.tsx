"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AdminPageHeader } from "@/app/components/admin/AdminPageHeader";
import type { PlatformSettings, PlatformVoiceConfig } from "@/lib/platform-settings";
import type { AiProvider, ConnectorConfig } from "@/lib/types";
import { fetchJson } from "@/lib/fetch-json";

type Tab = "ai" | "voice";
type CatalogProvider = AiProvider | "voice";
type ConnState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "ok" }
  | { status: "failed"; error: string };

const PROVIDERS: AiProvider[] = ["deepseek", "openai", "claude"];
const PROVIDER_LABEL: Record<AiProvider, string> = {
  deepseek: "DeepSeek",
  openai: "OpenAI",
  claude: "Claude",
};

function keyIsSet(value: string): boolean {
  return value.trim().length > 0;
}

function isProviderActive(
  provider: AiProvider,
  settings: PlatformSettings,
  connections: Partial<Record<CatalogProvider, ConnState>>
): boolean {
  if (!keyIsSet(settings.ai.connectors[provider].apiKey)) return false;
  return connections[provider]?.status !== "failed";
}

function ConnectionBadge({ conn }: { conn: ConnState }) {
  if (conn.status === "checking") {
    return <p className="admin-conn-idle">Checking connection…</p>;
  }
  if (conn.status === "ok") {
    return <p className="admin-conn-ok">Connection OK</p>;
  }
  if (conn.status === "failed") {
    return (
      <p className="admin-conn-fail">
        Failed{conn.error ? ` — ${conn.error}` : ""}
      </p>
    );
  }
  return null;
}

export default function AdminAiPage() {
  const [tab, setTab] = useState<Tab>("ai");
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<CatalogProvider | null>(null);
  const [connections, setConnections] = useState<
    Partial<Record<CatalogProvider, ConnState>>
  >({});

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

  const persist = async (next: PlatformSettings) => {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetchJson<{ settings: PlatformSettings }>(
        "/api/admin/platform",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        }
      );
      setSettings(res.settings);
      setMsg("Saved.");
      return res.settings;
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Save failed");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const saveDefaultProvider = async (defaultProvider: AiProvider) => {
    if (!settings) return;
    if (!isProviderActive(defaultProvider, settings, connections)) return;
    await persist({
      ...settings,
      ai: { ...settings.ai, defaultProvider },
    });
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
        title="AI & Voice"
        subtitle="Platform-wide models and TTS. Applies to all users."
      />
      <main className="admin-main">
        <div className="admin-tabs">
          <button
            type="button"
            className={`admin-tab ${tab === "ai" ? "admin-tab-active" : ""}`}
            onClick={() => setTab("ai")}
          >
            AI
          </button>
          <button
            type="button"
            className={`admin-tab ${tab === "voice" ? "admin-tab-active" : ""}`}
            onClick={() => setTab("voice")}
          >
            Voice
          </button>
        </div>

        {tab === "ai" && (
          <>
            <section className="admin-panel admin-form-stack">
              <h2 className="admin-panel-title">Default provider</h2>
              <p className="admin-panel-sub">
                Used for chat and session interpretation. Only providers with an
                active API key can be selected.
              </p>
              <label className="admin-field-label">
                Default provider
                <select
                  className="field"
                  value={settings.ai.defaultProvider}
                  disabled={busy}
                  onChange={(e) =>
                    void saveDefaultProvider(e.target.value as AiProvider)
                  }
                >
                  {PROVIDERS.map((p) => {
                    const active = isProviderActive(p, settings, connections);
                    return (
                      <option key={p} value={p} disabled={!active}>
                        {PROVIDER_LABEL[p]}
                        {active ? "" : " — no key"}
                      </option>
                    );
                  })}
                </select>
              </label>
            </section>

            <div className="admin-provider-grid">
              {PROVIDERS.map((p) => {
                const cfg = settings.ai.connectors[p];
                const conn = connections[p] ?? { status: "idle" as const };
                return (
                  <article key={p} className="admin-provider-card">
                    <div className="admin-provider-card-head">
                      <div>
                        <h3 className="admin-panel-title">{PROVIDER_LABEL[p]}</h3>
                        {settings.ai.defaultProvider === p && (
                          <p className="admin-provider-default">Default</p>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setModal(p)}
                      >
                        Configure
                      </button>
                    </div>
                    <p className="admin-provider-status">
                      {keyIsSet(cfg.apiKey) ? "Key set" : "Key not set"}
                      {cfg.model ? ` · ${cfg.model}` : ""}
                    </p>
                    <ConnectionBadge conn={conn} />
                  </article>
                );
              })}
            </div>
          </>
        )}

        {tab === "voice" && (
          <div className="admin-provider-grid">
            <article className="admin-provider-card">
              <div className="admin-provider-card-head">
                <div>
                  <h3 className="admin-panel-title">ElevenLabs</h3>
                  <p className="admin-panel-sub">
                    Text-to-speech for agent lines. Users only toggle auto-play.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setModal("voice")}
                >
                  Configure
                </button>
              </div>
              <p className="admin-provider-status">
                {keyIsSet(settings.ai.voice.apiKey) ? "Key set" : "Key not set"}
                {settings.ai.voice.model ? ` · ${settings.ai.voice.model}` : ""}
              </p>
              {settings.ai.voice.voiceId && (
                <p className="admin-provider-status">
                  Voice {settings.ai.voice.voiceId}
                </p>
              )}
              <ConnectionBadge
                conn={connections.voice ?? { status: "idle" }}
              />
            </article>
          </div>
        )}

        {msg && <p className="admin-invite-msg">{msg}</p>}
      </main>

      {modal && settings && (
        <ConfigureModal
          provider={modal}
          settings={settings}
          busy={busy}
          onClose={() => setModal(null)}
          onConnection={(provider, conn) =>
            setConnections((prev) => ({ ...prev, [provider]: conn }))
          }
          onSave={async (patch) => {
            const next: PlatformSettings = {
              ...settings,
              ai: {
                ...settings.ai,
                ...patch,
                connectors: {
                  ...settings.ai.connectors,
                  ...patch.connectors,
                },
                voice: patch.voice ?? settings.ai.voice,
              },
            };
            const saved = await persist(next);
            if (saved) setModal(null);
          }}
        />
      )}
    </div>
  );
}

function ConfigureModal({
  provider,
  settings,
  busy,
  onClose,
  onSave,
  onConnection,
}: {
  provider: CatalogProvider;
  settings: PlatformSettings;
  busy: boolean;
  onClose: () => void;
  onSave: (patch: {
    connectors?: PlatformSettings["ai"]["connectors"];
    voice?: PlatformVoiceConfig;
  }) => Promise<void>;
  onConnection: (provider: CatalogProvider, conn: ConnState) => void;
}) {
  const isVoice = provider === "voice";
  const initial = isVoice
    ? settings.ai.voice
    : settings.ai.connectors[provider];
  const [apiKey, setApiKey] = useState(initial.apiKey);
  const [model, setModel] = useState(initial.model);
  const [voiceId, setVoiceId] = useState(
    isVoice ? settings.ai.voice.voiceId : ""
  );
  const [models, setModels] = useState<string[]>([]);
  const [voices, setVoices] = useState<{ id: string; name: string }[]>([]);
  const [catalogError, setCatalogError] = useState("");
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [allowManual, setAllowManual] = useState(false);
  const [conn, setConnState] = useState<ConnState>({ status: "idle" });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modelRef = useRef(model);
  const voiceIdRef = useRef(voiceId);
  modelRef.current = model;
  voiceIdRef.current = voiceId;

  const applyConn = useCallback(
    (next: ConnState) => {
      setConnState(next);
      onConnection(provider, next);
    },
    [onConnection, provider]
  );

  const testKey = useCallback(
    async (key: string) => {
      if (!key.trim()) {
        applyConn({ status: "idle" });
        return;
      }
      applyConn({ status: "checking" });
      try {
        const res = await fetchJson<{ ok?: boolean; error?: string }>(
          "/api/admin/ai/test-connection",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ provider, apiKey: key }),
          }
        );
        if (res.ok) applyConn({ status: "ok" });
        else {
          applyConn({
            status: "failed",
            error: typeof res.error === "string" ? res.error : "Invalid key",
          });
        }
      } catch (err) {
        applyConn({
          status: "failed",
          error: err instanceof Error ? err.message : "Connection failed",
        });
      }
    },
    [applyConn, provider]
  );

  const loadCatalog = useCallback(
    async (key: string) => {
      setCatalogLoading(true);
      setCatalogError("");
      try {
        const res = await fetchJson<{
          models?: string[];
          voices?: { id: string; name: string }[];
          error?: string;
        }>("/api/admin/ai/models", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider, apiKey: key }),
        });
        const nextModels = Array.isArray(res.models) ? res.models : [];
        setModels(nextModels);
        setVoices(Array.isArray(res.voices) ? res.voices : []);
        setAllowManual(nextModels.length === 0 && !(isVoice && res.voices?.length));
        if (nextModels.length && !nextModels.includes(modelRef.current)) {
          setModel(nextModels[0]);
        }
        if (isVoice && res.voices?.length) {
          const ids = res.voices.map((v) => v.id);
          if (voiceIdRef.current && !ids.includes(voiceIdRef.current)) {
            setVoiceId(res.voices[0].id);
          }
        }
      } catch (err) {
        setModels([]);
        setVoices([]);
        setAllowManual(true);
        setCatalogError(
          err instanceof Error ? err.message : "Could not list models"
        );
      } finally {
        setCatalogLoading(false);
      }
    },
    [provider, isVoice]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    void testKey(apiKey);
    if (apiKey.trim()) void loadCatalog(apiKey);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // initial open only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onKeyChange = (value: string) => {
    setApiKey(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void testKey(value);
      if (value.trim()) void loadCatalog(value);
    }, 600);
  };

  const title = isVoice ? "ElevenLabs" : PROVIDER_LABEL[provider];

  return (
    <div
      className="admin-modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="admin-modal"
        role="dialog"
        aria-labelledby="admin-ai-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="admin-ai-modal-title" className="admin-panel-title">
          Configure {title}
        </h2>
        <p className="admin-panel-sub">
          Keys are stored in platform settings. Env fallbacks still apply if
          this field is empty.
        </p>

        <div className="admin-form-stack mt-4">
          <label className="admin-field-label">
            API key
            <input
              type="password"
              className="field"
              autoComplete="off"
              value={apiKey}
              onChange={(e) => onKeyChange(e.target.value)}
              onBlur={() => {
                void testKey(apiKey);
                if (apiKey.trim()) void loadCatalog(apiKey);
              }}
            />
          </label>
          <div className="admin-conn-row">
            <ConnectionBadge conn={conn} />
            <button
              type="button"
              className="admin-btn-edit"
              disabled={conn.status === "checking"}
              onClick={() => {
                void testKey(apiKey);
                if (apiKey.trim()) void loadCatalog(apiKey);
              }}
            >
              Test
            </button>
          </div>

          {isVoice ? (
            <>
              <label className="admin-field-label">
                Voice
                {voices.length > 0 && !allowManual ? (
                  <select
                    className="field"
                    value={
                      voices.some((v) => v.id === voiceId)
                        ? voiceId
                        : voices[0]?.id ?? ""
                    }
                    onChange={(e) => setVoiceId(e.target.value)}
                  >
                    {voices.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="field"
                    value={voiceId}
                    onChange={(e) => setVoiceId(e.target.value)}
                    placeholder={
                      catalogLoading ? "Loading voices…" : "Voice ID"
                    }
                  />
                )}
              </label>
              <label className="admin-field-label">
                Model
                {models.length > 0 && !allowManual ? (
                  <select
                    className="field"
                    value={models.includes(model) ? model : models[0]}
                    onChange={(e) => setModel(e.target.value)}
                  >
                    {models.map((id) => (
                      <option key={id} value={id}>
                        {id}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="field"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder={
                      catalogLoading ? "Loading models…" : "Model"
                    }
                  />
                )}
              </label>
            </>
          ) : (
            <label className="admin-field-label">
              Model
              {models.length > 0 && !allowManual ? (
                <select
                  className="field"
                  value={models.includes(model) ? model : models[0]}
                  onChange={(e) => setModel(e.target.value)}
                >
                  {models.map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="field"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder={catalogLoading ? "Loading models…" : "Model"}
                />
              )}
            </label>
          )}

          {catalogLoading && (
            <p className="admin-conn-idle">Loading models from provider…</p>
          )}
          {catalogError && (
            <p className="admin-conn-fail">
              Could not list models — {catalogError}. You can type a model as a
              last resort.
            </p>
          )}
          <button
            type="button"
            className="admin-link w-fit border-0 bg-transparent p-0"
            onClick={() => {
              if (apiKey.trim()) void loadCatalog(apiKey);
            }}
          >
            Refresh models
          </button>
        </div>

        <div className="admin-modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={busy}
            onClick={() => {
              if (isVoice) {
                const voice: PlatformVoiceConfig = {
                  ...(initial as PlatformVoiceConfig),
                  apiKey,
                  model,
                  voiceId,
                };
                void onSave({ voice });
              } else {
                const connectors = {
                  ...settings.ai.connectors,
                  [provider]: {
                    ...(initial as ConnectorConfig),
                    apiKey,
                    model,
                  },
                };
                void onSave({ connectors });
              }
            }}
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

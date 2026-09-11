"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { AdminPageHeader } from "@/app/components/admin/AdminPageHeader";
import { AdminTabs, useAdminTab } from "@/app/components/admin/AdminTabs";
import {
  AdminVoicePicker,
  type AdminVoiceOption,
} from "@/app/components/admin/AdminVoicePicker";
import type { PlatformSettings, PlatformVoiceConfig } from "@/lib/platform-settings";
import type { AiProvider, ConnectorConfig } from "@/lib/types";
import { fetchJson } from "@/lib/fetch-json";
import { canonicalizeDeepseekModelId } from "@/lib/provider-catalog";

const TABS = ["ai", "voice"] as const;
type Tab = (typeof TABS)[number];
const TAB_ITEMS = [
  { id: "ai", label: "AI" },
  { id: "voice", label: "Voice" },
] as const;

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

function displayModelId(provider: CatalogProvider, model: string): string {
  const t = model.trim();
  if (!t) return "";
  if (provider === "deepseek") return canonicalizeDeepseekModelId(t);
  return t;
}

function isProviderActive(
  provider: AiProvider,
  settings: PlatformSettings,
  connections: Partial<Record<CatalogProvider, ConnState>>
): boolean {
  if (!keyIsSet(settings.ai.connectors[provider].apiKey)) return false;
  return connections[provider]?.status !== "failed";
}

function ConnectionBadge({
  conn,
  chip = false,
}: {
  conn: ConnState;
  chip?: boolean;
}) {
  if (conn.status === "checking") {
    return (
      <p className={chip ? "admin-status-chip admin-status-chip-idle" : "admin-conn-idle"}>
        Checking…
      </p>
    );
  }
  if (conn.status === "ok") {
    return (
      <p className={chip ? "admin-status-chip admin-status-chip-ok" : "admin-conn-ok"}>
        Connected
      </p>
    );
  }
  if (conn.status === "failed") {
    return (
      <p
        className={chip ? "admin-status-chip admin-status-chip-fail" : "admin-conn-fail"}
        title={conn.error || undefined}
      >
        {chip ? "Failed" : `Failed${conn.error ? ` — ${conn.error}` : ""}`}
      </p>
    );
  }
  return null;
}

function ProviderHealth({
  provider,
  hasKey,
  model,
  conn,
  isDefault,
  extra,
}: {
  provider: CatalogProvider;
  hasKey: boolean;
  model?: string;
  conn: ConnState;
  isDefault?: boolean;
  extra?: string;
}) {
  const modelLabel = model ? displayModelId(provider, model) : "";
  return (
    <div className="admin-provider-health">
      <div className="admin-provider-chips">
        {isDefault ? (
          <span className="admin-status-chip admin-status-chip-default">Default</span>
        ) : null}
        <span
          className={
            hasKey
              ? "admin-status-chip admin-status-chip-ok"
              : "admin-status-chip admin-status-chip-off"
          }
        >
          {hasKey ? "Key active" : "No key"}
        </span>
        <ConnectionBadge conn={conn} chip />
      </div>
      {modelLabel ? (
        <p className="admin-provider-model">
          Model <span className="admin-provider-model-id">{modelLabel}</span>
        </p>
      ) : null}
      {extra ? <p className="admin-provider-model">{extra}</p> : null}
    </div>
  );
}

function AdminAiPageInner() {
  const [tab, setTab] = useAdminTab(TABS, "ai");
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<CatalogProvider | null>(null);
  const [voiceReloadToken, setVoiceReloadToken] = useState(0);
  const [connections, setConnections] = useState<
    Partial<Record<CatalogProvider, ConnState>>
  >({});
  const settingsRef = useRef(settings);
  const persistErrorRef = useRef("");
  settingsRef.current = settings;

  const load = useCallback(async () => {
    const res = await fetchJson<{ settings: PlatformSettings }>(
      "/api/admin/platform"
    );
    setSettings(res.settings);
  }, []);

  const probeConnection = useCallback(async (provider: CatalogProvider) => {
    setConnections((prev) => ({ ...prev, [provider]: { status: "checking" } }));
    try {
      const res = await fetchJson<{ ok?: boolean; error?: string }>(
        "/api/admin/ai/test-connection",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider }),
        }
      );
      if (res.ok) {
        setConnections((prev) => ({ ...prev, [provider]: { status: "ok" } }));
      } else {
        setConnections((prev) => ({
          ...prev,
          [provider]: {
            status: "failed",
            error: typeof res.error === "string" ? res.error : "Invalid key",
          },
        }));
      }
    } catch (err) {
      setConnections((prev) => ({
        ...prev,
        [provider]: {
          status: "failed",
          error: err instanceof Error ? err.message : "Connection failed",
        },
      }));
    }
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

  useEffect(() => {
    if (!settings) return;
    for (const p of PROVIDERS) {
      if (keyIsSet(settings.ai.connectors[p].apiKey)) {
        void probeConnection(p);
      }
    }
    void probeConnection("voice");
  }, [settings, probeConnection]);

  const persist = async (
    next: PlatformSettings,
    opts?: { quiet?: boolean }
  ) => {
    setBusy(true);
    setMsg("");
    persistErrorRef.current = "";
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
      if (!opts?.quiet) setMsg("Saved.");
      return res.settings;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed";
      persistErrorRef.current = message;
      setMsg(message);
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

  const saveVoiceSelection = async (voice: AdminVoiceOption) => {
    const current = settingsRef.current;
    if (!current) {
      throw new Error("Settings not loaded");
    }
    const next: PlatformSettings = {
      ...current,
      ai: {
        ...current.ai,
        voice: {
          ...current.ai.voice,
          voiceId: voice.id,
        },
      },
    };
    const saved = await persist(next, { quiet: true });
    if (!saved) {
      throw new Error(persistErrorRef.current || "Could not save voice");
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
        title="AI & Voice"
        subtitle="Platform-wide models and TTS. Applies to all users."
      />
      <main className="admin-main">
        <AdminTabs
          tabs={TAB_ITEMS}
          value={tab}
          onChange={(id) => setTab(id as Tab)}
        />

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
                      <h3 className="admin-panel-title">{PROVIDER_LABEL[p]}</h3>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setModal(p)}
                      >
                        Configure
                      </button>
                    </div>
                    <ProviderHealth
                      provider={p}
                      hasKey={keyIsSet(cfg.apiKey)}
                      model={cfg.model}
                      conn={conn}
                      isDefault={settings.ai.defaultProvider === p}
                    />
                  </article>
                );
              })}
            </div>
          </>
        )}

        {tab === "voice" && (
          <div className="admin-voice-page">
            <article className="admin-provider-card admin-voice-settings">
              <div className="admin-provider-card-head">
                <div>
                  <h3 className="admin-panel-title">ElevenLabs</h3>
                  <p className="admin-panel-sub">
                    API key and model. Users only toggle auto-play.
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
              <ProviderHealth
                provider="voice"
                hasKey={keyIsSet(settings.ai.voice.apiKey)}
                model={settings.ai.voice.model}
                conn={connections.voice ?? { status: "idle" }}
              />
            </article>

            <hr className="admin-voice-divider" />

            <AdminVoicePicker
              selectedVoiceId={settings.ai.voice.voiceId}
              reloadToken={voiceReloadToken}
              busy={busy}
              onSelect={saveVoiceSelection}
            />
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
            const current = settingsRef.current ?? settings;
            const next: PlatformSettings = {
              ...current,
              ai: {
                ...current.ai,
                ...patch,
                connectors: {
                  ...current.ai.connectors,
                  ...patch.connectors,
                },
                voice: patch.voice ?? current.ai.voice,
              },
            };
            const saved = await persist(next);
            if (saved) {
              setModal(null);
              if (modal === "voice") {
                setVoiceReloadToken((n) => n + 1);
              }
            }
          }}
        />
      )}
    </div>
  );
}

export default function AdminAiPage() {
  return (
    <Suspense
      fallback={
        <div className="admin-page flex min-h-screen items-center justify-center">
          <p className="text-[var(--text-secondary)]">Loading…</p>
        </div>
      }
    >
      <AdminAiPageInner />
    </Suspense>
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
  const [customModelId, setCustomModelId] = useState("");
  const [voiceId, setVoiceId] = useState(
    isVoice ? settings.ai.voice.voiceId : ""
  );
  const [customVoiceId, setCustomVoiceId] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [voices, setVoices] = useState<{ id: string; name: string }[]>([]);
  const [catalogError, setCatalogError] = useState("");
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [allowManual, setAllowManual] = useState(false);
  const [conn, setConnState] = useState<ConnState>({ status: "idle" });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modelRef = useRef(model);
  const customModelIdRef = useRef(customModelId);
  const voiceIdRef = useRef(voiceId);
  const customVoiceIdRef = useRef(customVoiceId);
  modelRef.current = model;
  customModelIdRef.current = customModelId;
  voiceIdRef.current = voiceId;
  customVoiceIdRef.current = customVoiceId;

  const applyConn = useCallback(
    (next: ConnState) => {
      setConnState(next);
      onConnection(provider, next);
    },
    [onConnection, provider]
  );

  const testKey = useCallback(
    async (key: string) => {
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
          const errMsg =
            typeof res.error === "string" ? res.error : "Invalid key";
          if (!key.trim() && /no api key/i.test(errMsg)) {
            applyConn({ status: "idle" });
          } else {
            applyConn({ status: "failed", error: errMsg });
          }
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
        const nextVoices = Array.isArray(res.voices) ? res.voices : [];
        setModels(nextModels);
        setVoices(nextVoices);
        setAllowManual(
          nextModels.length === 0 && !(isVoice && nextVoices.length > 0)
        );
        if (nextModels.length > 0) {
          const effectiveModel =
            customModelIdRef.current.trim() || modelRef.current;
          if (effectiveModel && nextModels.includes(effectiveModel)) {
            setModel(effectiveModel);
            setCustomModelId("");
          } else if (effectiveModel && !nextModels.includes(effectiveModel)) {
            setCustomModelId(effectiveModel);
            setModel(nextModels[0]);
          } else if (!modelRef.current) {
            setModel(nextModels[0]);
          }
        }
        if (isVoice && nextVoices.length > 0) {
          const ids = nextVoices.map((v) => v.id);
          const effective =
            customVoiceIdRef.current.trim() || voiceIdRef.current;
          if (effective && ids.includes(effective)) {
            setVoiceId(effective);
            setCustomVoiceId("");
          } else if (effective && !ids.includes(effective)) {
            setCustomVoiceId(effective);
            setVoiceId(nextVoices[0].id);
          } else if (!voiceIdRef.current) {
            setVoiceId(nextVoices[0].id);
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
    void loadCatalog(apiKey);
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
      void loadCatalog(value);
    }, 600);
  };

  const resolvedVoiceId = customVoiceId.trim() || voiceId;
  const resolvedModel = customModelId.trim() || model;

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
                void loadCatalog(apiKey);
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
                void loadCatalog(apiKey);
              }}
            >
              Test
            </button>
          </div>

          {isVoice ? (
            <>
              {voices.length > 0 ? (
                <>
                  <label className="admin-field-label">
                    Voice
                    <select
                      className="field"
                      value={
                        voices.some((v) => v.id === voiceId)
                          ? voiceId
                          : voices[0]?.id ?? ""
                      }
                      disabled={Boolean(customVoiceId.trim())}
                      onChange={(e) => {
                        setVoiceId(e.target.value);
                        setCustomVoiceId("");
                      }}
                    >
                      {voices.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="admin-field-label">
                    Custom voice (optional)
                    <input
                      className="field"
                      value={customVoiceId}
                      onChange={(e) => setCustomVoiceId(e.target.value)}
                      placeholder="Overrides the voice above"
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </label>
                </>
              ) : (
                <label className="admin-field-label">
                  Voice
                  <input
                    className="field"
                    value={voiceId}
                    onChange={(e) => setVoiceId(e.target.value)}
                    placeholder={
                      catalogLoading ? "Loading voices…" : "Voice ID"
                    }
                    autoComplete="off"
                    spellCheck={false}
                  />
                </label>
              )}
              {models.length > 0 ? (
                <>
                  <label className="admin-field-label">
                    Model
                    <select
                      className="field"
                      value={models.includes(model) ? model : models[0]}
                      disabled={Boolean(customModelId.trim())}
                      onChange={(e) => {
                        setModel(e.target.value);
                        setCustomModelId("");
                      }}
                    >
                      {models.map((id) => (
                        <option key={id} value={id}>
                          {id}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="admin-field-label">
                    Custom model (optional)
                    <input
                      className="field"
                      value={customModelId}
                      onChange={(e) => setCustomModelId(e.target.value)}
                      placeholder="Overrides the model above"
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </label>
                </>
              ) : (
                <label className="admin-field-label">
                  Model
                  <input
                    className="field"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder={
                      catalogLoading ? "Loading models…" : "Model"
                    }
                    autoComplete="off"
                    spellCheck={false}
                  />
                </label>
              )}
            </>
          ) : (
            <label className="admin-field-label">
              Model
              {models.length > 0 && !allowManual ? (
                <select
                  className="field"
                  value={models.includes(model) ? model : models[0]}
                  onChange={(e) => {
                    setModel(e.target.value);
                    setCustomModelId("");
                  }}
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
            <p className="admin-conn-idle">
              {isVoice
                ? "Loading voices from ElevenLabs…"
                : "Loading models from provider…"}
            </p>
          )}
          {catalogError && (
            <p className="admin-conn-fail">
              {isVoice
                ? `Could not list voices — ${catalogError}. Enter a voice ID manually, or fix the API key.`
                : `Could not list models — ${catalogError}. You can type a model as a last resort.`}
            </p>
          )}
          <button
            type="button"
            className="admin-link w-fit border-0 bg-transparent p-0"
            onClick={() => {
              void loadCatalog(apiKey);
            }}
          >
            {isVoice ? "Refresh voices" : "Refresh models"}
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
                  model: resolvedModel,
                  voiceId: resolvedVoiceId,
                };
                void onSave({ voice });
              } else {
                const connectors = {
                  ...settings.ai.connectors,
                  [provider]: {
                    ...(initial as ConnectorConfig),
                    apiKey,
                    model: resolvedModel,
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

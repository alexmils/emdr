"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  AppSettings,
  BlsSettings,
  Memory,
  MemorySet,
  Message,
  SessionKind,
  Thread,
  ThreadMemorySet,
} from "@/lib/types";
import { DEFAULT_BLS, DEFAULT_SETTINGS } from "@/lib/types";
import type { SessionMode } from "@/lib/protocol";
import { fetchJson } from "@/lib/fetch-json";
import { shouldBootstrapAgent } from "@/lib/session-mode";
import {
  resolveAdDecision,
  type AdDecisionState,
  type AdGateResult,
  type PublicAdsConfig,
} from "@/lib/ads";
import { UpgradeModal } from "./UpgradeModal";
import { AdInterstitial } from "./AdInterstitial";
import { AdSenseLoader } from "./AdSenseLoader";

export type EntitlementPublic = {
  accessTier: string;
  canUseApp: boolean;
  needsOnboarding: boolean;
  needsPayment: boolean;
  plan: string;
  status: string;
  guidedUsed: number;
  guidedLimit: number;
  guidedRemaining: number;
  blsSecondsUsed: number;
  blsSecondsLimit: number;
  blsSecondsRemaining: number;
  isTrialLimited: boolean;
};

function adFreqStorageKey(userId: string | null): string {
  return userId ? `emdr_ad_freq_v1:${userId}` : "emdr_ad_freq_v1:anon";
}

function loadAdFreqState(userId: string | null): AdDecisionState {
  if (typeof window === "undefined") {
    return { sessionShownCount: 0, lastShownAt: null, setsSinceLastAd: 0 };
  }
  try {
    const raw = localStorage.getItem(adFreqStorageKey(userId));
    if (!raw) {
      return { sessionShownCount: 0, lastShownAt: null, setsSinceLastAd: 0 };
    }
    const parsed = JSON.parse(raw) as Partial<AdDecisionState>;
    return {
      sessionShownCount: 0, // reset per browser session
      lastShownAt:
        typeof parsed.lastShownAt === "number" ? parsed.lastShownAt : null,
      setsSinceLastAd: 0, // reset per browser session
    };
  } catch {
    return { sessionShownCount: 0, lastShownAt: null, setsSinceLastAd: 0 };
  }
}

function saveAdFreqState(userId: string | null, state: AdDecisionState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(adFreqStorageKey(userId), JSON.stringify(state));
  } catch {
    // ignore quota / private mode
  }
}

type UpgradeState = {
  open: boolean;
  reason: "trial_limit_reached" | "bls_limit_reached" | "generic";
};

interface AppState {
  threads: Thread[];
  activeThreadId: string | null;
  messages: Message[];
  memorySets: MemorySet[];
  threadMemorySets: ThreadMemorySet[];
  settings: AppSettings;
  bls: BlsSettings;
  sessionMode: SessionMode;
  entitlement: EntitlementPublic | null;
  setSessionMode: (m: SessionMode) => void;
  setBls: (
    patch:
      | Partial<BlsSettings>
      | ((prev: BlsSettings) => Partial<BlsSettings>)
  ) => void;
  refreshThreads: () => Promise<void>;
  refreshEntitlement: () => Promise<EntitlementPublic | null>;
  selectThread: (id: string) => Promise<void>;
  createThread: () => Promise<void>;
  updateThreadLocal: (id: string, patch: Partial<Thread>) => Promise<void>;
  chooseSessionMode: (kind: Exclude<SessionKind, "pending">) => Promise<boolean>;
  deleteThread: (id: string) => Promise<void>;
  sendUserMessage: (text: string) => Promise<void>;
  requestCheckIn: () => Promise<void>;
  bootstrapAgent: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  saveSettings: (s: AppSettings) => Promise<void>;
  memories: Memory[];
  refreshMemories: () => Promise<void>;
  setThreadMemorySet: (setId: string, enabled: boolean) => Promise<void>;
  openUpgradeModal: (reason?: UpgradeState["reason"]) => void;
  leaseBlsSeconds: (seconds: number) => Promise<number>;
  /** Show free-session interstitial when frequency rules say so. */
  maybeShowAd: () => Promise<AdGateResult>;
  /** Call after a free BLS set completes (for every_n_sets frequency). */
  noteAdSetCompleted: () => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [memorySets, setMemorySets] = useState<MemorySet[]>([]);
  const [threadMemorySets, setThreadMemorySets] = useState<ThreadMemorySet[]>(
    []
  );
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [bls, setBlsState] = useState<BlsSettings>(DEFAULT_BLS);
  const [sessionMode, setSessionMode] = useState<SessionMode>("idle");
  const [entitlement, setEntitlement] = useState<EntitlementPublic | null>(null);
  const [adsConfig, setAdsConfig] = useState<PublicAdsConfig>({
    adsActive: false,
  });
  const [adUserId, setAdUserId] = useState<string | null>(null);
  const [adFreq, setAdFreq] = useState<AdDecisionState>(() =>
    loadAdFreqState(null)
  );
  const [adOpen, setAdOpen] = useState(false);
  const adResolverRef = useRef<((result: AdGateResult) => void) | null>(null);
  const [upgrade, setUpgrade] = useState<UpgradeState>({
    open: false,
    reason: "generic",
  });

  const openUpgradeModal = useCallback(
    (reason: UpgradeState["reason"] = "generic") => {
      setUpgrade({ open: true, reason });
    },
    []
  );

  const refreshEntitlement = useCallback(async () => {
    try {
      const data = await fetchJson<EntitlementPublic & { ads?: PublicAdsConfig }>(
        "/api/billing/status"
      );
      setEntitlement(data);
      setAdsConfig(data.ads ?? { adsActive: false });
      return data;
    } catch (err) {
      console.error("refreshEntitlement failed:", err);
      return null;
    }
  }, []);

  const recordAdShown = useCallback(() => {
    setAdFreq((prev) => {
      const next: AdDecisionState = {
        sessionShownCount: prev.sessionShownCount + 1,
        lastShownAt: Date.now(),
        setsSinceLastAd: 0,
      };
      saveAdFreqState(adUserId, next);
      return next;
    });
  }, [adUserId]);

  const finishAd = useCallback(
    (result: AdGateResult) => {
      setAdOpen(false);
      if (result === "continued") {
        recordAdShown();
      }
      const resolve = adResolverRef.current;
      adResolverRef.current = null;
      resolve?.(result);
    },
    [recordAdShown]
  );

  const maybeShowAd = useCallback((): Promise<AdGateResult> => {
    if (!adsConfig.adsActive) return Promise.resolve("skipped");
    const decision = resolveAdDecision(
      {
        adsActive: true,
        frequencyMode: adsConfig.frequencyMode,
        everyMinutes: adsConfig.everyMinutes,
        everyNSets: adsConfig.everyNSets,
      },
      adFreq
    );
    if (!decision.show) return Promise.resolve("skipped");

    return new Promise((resolve) => {
      adResolverRef.current = resolve;
      setAdOpen(true);
    });
  }, [adsConfig, adFreq]);

  const noteAdSetCompleted = useCallback(() => {
    setAdFreq((prev) => {
      const next = {
        ...prev,
        setsSinceLastAd: prev.setsSinceLastAd + 1,
      };
      saveAdFreqState(adUserId, next);
      return next;
    });
  }, [adUserId]);

  const refreshThreads = useCallback(async () => {
    try {
      const data = await fetchJson<{ threads?: Thread[] }>("/api/threads");
      setThreads(data.threads ?? []);
    } catch (err) {
      console.error("refreshThreads failed:", err);
    }
  }, []);

  const selectThread = useCallback(async (id: string) => {
    try {
      const data = await fetchJson<{
        messages?: Message[];
        memorySets?: ThreadMemorySet[];
        allSets?: MemorySet[];
      }>(`/api/threads?id=${id}`);
      setActiveThreadId(id);
      setMessages(data.messages ?? []);
      setThreadMemorySets(data.memorySets ?? []);
      setMemorySets(data.allSets ?? []);
    } catch (err) {
      console.error("selectThread failed:", err);
    }
  }, []);

  const createThread = useCallback(async () => {
    try {
      const res = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", title: "New session" }),
      });
      const data = (await res.json()) as {
        thread?: Thread;
        code?: string;
        entitlement?: EntitlementPublic;
      };
      if (!res.ok) {
        if (data.entitlement) setEntitlement(data.entitlement);
        if (data.code === "trial_limit_reached" || data.code === "needs_payment") {
          openUpgradeModal(
            data.code === "trial_limit_reached"
              ? "trial_limit_reached"
              : "generic"
          );
        }
        return;
      }
      await refreshThreads();
      if (data.thread?.id) await selectThread(data.thread.id);
    } catch (err) {
      console.error("createThread failed:", err);
    }
  }, [refreshThreads, selectThread, openUpgradeModal]);

  const updateThreadLocal = useCallback(
    async (id: string, patch: Partial<Thread>) => {
      try {
        const res = await fetch("/api/threads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "update", id, patch }),
        });
        const data = (await res.json()) as {
          thread?: Thread;
          code?: string;
          entitlement?: EntitlementPublic;
        };
        if (!res.ok) {
          if (data.entitlement) setEntitlement(data.entitlement);
          if (data.code === "trial_limit_reached") {
            openUpgradeModal("trial_limit_reached");
          }
          return;
        }
        if (data.entitlement) setEntitlement(data.entitlement);
        if (data.thread) {
          setThreads((t) => t.map((x) => (x.id === id ? data.thread! : x)));
          if (activeThreadId === id) await selectThread(id);
        }
      } catch (err) {
        console.error("updateThreadLocal failed:", err);
      }
    },
    [activeThreadId, selectThread, openUpgradeModal]
  );

  const chooseSessionMode = useCallback(
    async (kind: Exclude<SessionKind, "pending">) => {
      if (!activeThreadId) return false;
      try {
        const res = await fetch("/api/threads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update",
            id: activeThreadId,
            patch: {
              mode: kind,
              title: kind === "free" ? "Free session" : "Guided session",
            },
          }),
        });
        const data = (await res.json()) as {
          thread?: Thread;
          code?: string;
          entitlement?: EntitlementPublic;
        };
        if (!res.ok) {
          if (data.entitlement) setEntitlement(data.entitlement);
          if (
            data.code === "trial_limit_reached" ||
            data.code === "bls_limit_reached"
          ) {
            openUpgradeModal(
              data.code === "bls_limit_reached"
                ? "bls_limit_reached"
                : "trial_limit_reached"
            );
          }
          return false;
        }
        if (data.entitlement) setEntitlement(data.entitlement);
        if (data.thread) {
          setThreads((t) =>
            t.map((x) => (x.id === activeThreadId ? data.thread! : x))
          );
          await selectThread(activeThreadId);
        }
        return true;
      } catch (err) {
        console.error("chooseSessionMode failed:", err);
        return false;
      }
    },
    [activeThreadId, selectThread, openUpgradeModal]
  );

  const leaseBlsSeconds = useCallback(
    async (seconds: number) => {
      try {
        const res = await fetch("/api/billing/bls-lease", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ seconds }),
        });
        const data = (await res.json()) as {
          granted?: number;
          code?: string;
          entitlement?: EntitlementPublic;
        };
        if (data.entitlement) setEntitlement(data.entitlement);
        if (!res.ok) {
          if (data.code === "bls_limit_reached") {
            openUpgradeModal("bls_limit_reached");
          }
          return 0;
        }
        return data.granted ?? 0;
      } catch (err) {
        console.error("leaseBlsSeconds failed:", err);
        return 0;
      }
    },
    [openUpgradeModal]
  );

  const deleteThread = useCallback(
    async (id: string) => {
      await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      await refreshThreads();
      if (activeThreadId === id) {
        setActiveThreadId(null);
        setMessages([]);
      }
    },
    [activeThreadId, refreshThreads]
  );

  const sendUserMessage = useCallback(
    async (text: string) => {
      if (!activeThreadId) return;
      const optimistic: Message = {
        id: `tmp-${Date.now()}`,
        threadId: activeThreadId,
        role: "user",
        content: text,
        createdAt: new Date().toISOString(),
      };
      setMessages((m) => [...m, optimistic]);
      const data = await fetchJson<{
        message?: Message;
        thread?: Thread;
      }>("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: activeThreadId, userMessage: text }),
      });
      if (data.thread) {
        setThreads((list) =>
          list.map((t) => (t.id === data.thread!.id ? data.thread! : t))
        );
      }
      if (data.message) {
        const assistantMsg = data.message;
        setMessages((m) => {
          const withoutTmp = m.filter((x) => x.id !== optimistic.id);
          const hasUser = withoutTmp.some(
            (x) => x.role === "user" && x.content === text
          );
          return hasUser
            ? [...withoutTmp, assistantMsg]
            : [...withoutTmp, optimistic, assistantMsg];
        });
      }
    },
    [activeThreadId]
  );

  const requestCheckIn = useCallback(async () => {
    if (!activeThreadId) return;
    const data = await fetchJson<{ message?: Message }>("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId: activeThreadId, afterSet: true }),
    });
    if (data.message) {
      setMessages((m) => [...m, data.message!]);
    }
  }, [activeThreadId]);

  const bootstrapAgent = useCallback(async () => {
    if (!activeThreadId) return;
    const data = await fetchJson<{ message?: Message }>("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId: activeThreadId, bootstrap: true }),
    });
    if (data.message) setMessages([data.message]);
  }, [activeThreadId]);

  const refreshSettings = useCallback(async () => {
    try {
      const data = await fetchJson<{
        settings?: AppSettings;
        memories?: Memory[];
        memorySets?: MemorySet[];
      }>("/api/settings");
      setSettings(data.settings ?? DEFAULT_SETTINGS);
      setMemories(data.memories ?? []);
      setMemorySets(data.memorySets ?? []);
    } catch (err) {
      console.error("refreshSettings failed:", err);
    }
  }, []);

  const saveSettings = useCallback(async (s: AppSettings) => {
    const data = await fetchJson<{ settings: AppSettings }>("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save_settings", settings: s }),
    });
    setSettings(data.settings);
  }, []);

  const refreshMemories = refreshSettings;

  const setThreadMemorySet = useCallback(
    async (setId: string, enabled: boolean) => {
      if (!activeThreadId) return;
      const data = await fetchJson<{ memorySets?: ThreadMemorySet[] }>(
        "/api/threads",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "set_memory",
            threadId: activeThreadId,
            setId,
            enabled,
          }),
        }
      );
      setThreadMemorySets(data.memorySets ?? []);
    },
    [activeThreadId]
  );

  const setBls = useCallback(
    (
      patch:
        | Partial<BlsSettings>
        | ((prev: BlsSettings) => Partial<BlsSettings>)
    ) => {
      setBlsState((b) => ({
        ...b,
        ...(typeof patch === "function" ? patch(b) : patch),
      }));
    },
    []
  );

  useEffect(() => {
    void refreshThreads();
    void refreshSettings();
    void refreshEntitlement();
  }, [refreshThreads, refreshSettings, refreshEntitlement]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = (await res.json()) as { user?: { id?: string } };
        const id =
          typeof data.user?.id === "string" && data.user.id
            ? data.user.id
            : null;
        setAdUserId(id);
        setAdFreq(loadAdFreqState(id));
      } catch {
        setAdUserId(null);
      }
    })();
  }, []);

  useEffect(() => {
    if (threads.length && !activeThreadId) {
      void selectThread(threads[0].id);
    }
  }, [threads, activeThreadId, selectThread]);

  useEffect(() => {
    const thread = threads.find((t) => t.id === activeThreadId);
    if (
      activeThreadId &&
      thread &&
      shouldBootstrapAgent(thread.mode, messages.length)
    ) {
      void bootstrapAgent();
    }
  }, [activeThreadId, messages.length, threads, bootstrapAgent]);

  const value = useMemo(
    () => ({
      threads,
      activeThreadId,
      messages,
      memorySets,
      threadMemorySets,
      settings,
      bls,
      sessionMode,
      entitlement,
      setSessionMode,
      setBls,
      refreshThreads,
      refreshEntitlement,
      selectThread,
      createThread,
      updateThreadLocal,
      chooseSessionMode,
      deleteThread,
      sendUserMessage,
      requestCheckIn,
      bootstrapAgent,
      refreshSettings,
      saveSettings,
      memories,
      refreshMemories,
      setThreadMemorySet,
      openUpgradeModal,
      leaseBlsSeconds,
      maybeShowAd,
      noteAdSetCompleted,
    }),
    [
      threads,
      activeThreadId,
      messages,
      memorySets,
      threadMemorySets,
      settings,
      bls,
      sessionMode,
      entitlement,
      setBls,
      refreshThreads,
      refreshEntitlement,
      selectThread,
      createThread,
      updateThreadLocal,
      chooseSessionMode,
      deleteThread,
      sendUserMessage,
      requestCheckIn,
      bootstrapAgent,
      refreshSettings,
      saveSettings,
      memories,
      refreshMemories,
      setThreadMemorySet,
      openUpgradeModal,
      leaseBlsSeconds,
      maybeShowAd,
      noteAdSetCompleted,
    ]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
      {adsConfig.adsActive && adsConfig.provider === "adsense" ? (
        <AdSenseLoader clientId={adsConfig.adsenseClient} />
      ) : null}
      <UpgradeModal
        open={upgrade.open}
        reason={upgrade.reason}
        guidedUsed={entitlement?.guidedUsed}
        guidedLimit={entitlement?.guidedLimit}
        blsSecondsUsed={entitlement?.blsSecondsUsed}
        blsSecondsLimit={entitlement?.blsSecondsLimit}
        onClose={() => setUpgrade((u) => ({ ...u, open: false }))}
      />
      <AdInterstitial
        open={adOpen}
        config={adsConfig.adsActive ? adsConfig : null}
        onContinue={() => finishAd("continued")}
        onUpgrade={() => {
          finishAd("upgraded");
          openUpgradeModal("generic");
        }}
      />
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

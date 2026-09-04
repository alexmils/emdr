"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

interface AppState {
  threads: Thread[];
  activeThreadId: string | null;
  messages: Message[];
  memorySets: MemorySet[];
  threadMemorySets: ThreadMemorySet[];
  settings: AppSettings;
  bls: BlsSettings;
  sessionMode: SessionMode;
  setSessionMode: (m: SessionMode) => void;
  setBls: (
    patch:
      | Partial<BlsSettings>
      | ((prev: BlsSettings) => Partial<BlsSettings>)
  ) => void;
  refreshThreads: () => Promise<void>;
  selectThread: (id: string) => Promise<void>;
  createThread: () => Promise<void>;
  updateThreadLocal: (id: string, patch: Partial<Thread>) => Promise<void>;
  chooseSessionMode: (kind: Exclude<SessionKind, "pending">) => Promise<void>;
  deleteThread: (id: string) => Promise<void>;
  sendUserMessage: (text: string) => Promise<void>;
  requestCheckIn: () => Promise<void>;
  bootstrapAgent: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  saveSettings: (s: AppSettings) => Promise<void>;
  memories: Memory[];
  refreshMemories: () => Promise<void>;
  setThreadMemorySet: (setId: string, enabled: boolean) => Promise<void>;
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
      const data = await fetchJson<{ thread?: Thread }>("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", title: "New session" }),
      });
      await refreshThreads();
      if (data.thread?.id) await selectThread(data.thread.id);
    } catch (err) {
      console.error("createThread failed:", err);
    }
  }, [refreshThreads, selectThread]);

  const updateThreadLocal = useCallback(
    async (id: string, patch: Partial<Thread>) => {
      try {
        const data = await fetchJson<{ thread?: Thread }>("/api/threads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "update", id, patch }),
        });
        if (data.thread) {
          setThreads((t) => t.map((x) => (x.id === id ? data.thread! : x)));
          if (activeThreadId === id) await selectThread(id);
        }
      } catch (err) {
        console.error("updateThreadLocal failed:", err);
      }
    },
    [activeThreadId, selectThread]
  );

  const chooseSessionMode = useCallback(
    async (kind: Exclude<SessionKind, "pending">) => {
      if (!activeThreadId) return;
      const patch: Partial<Thread> = { mode: kind };
      if (kind === "free") patch.title = "Free session";
      if (kind === "guided") patch.title = "Guided session";
      await updateThreadLocal(activeThreadId, patch);
    },
    [activeThreadId, updateThreadLocal]
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
      const assistantMsg = data.message;
      setMessages((m) => [...m, assistantMsg]);
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
  }, [refreshThreads, refreshSettings]);

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
      setSessionMode,
      setBls,
      refreshThreads,
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
      setBls,
      refreshThreads,
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
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

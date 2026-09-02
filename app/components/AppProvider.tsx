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
  Thread,
  ThreadMemorySet,
} from "@/lib/types";
import { DEFAULT_BLS, DEFAULT_SETTINGS } from "@/lib/types";
import type { SessionMode } from "@/lib/protocol";

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
  setBls: (patch: Partial<BlsSettings>) => void;
  refreshThreads: () => Promise<void>;
  selectThread: (id: string) => Promise<void>;
  createThread: () => Promise<void>;
  updateThreadLocal: (id: string, patch: Partial<Thread>) => Promise<void>;
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
    const res = await fetch("/api/threads");
    const data = await res.json();
    setThreads(data.threads ?? []);
  }, []);

  const selectThread = useCallback(async (id: string) => {
    const res = await fetch(`/api/threads?id=${id}`);
    const data = await res.json();
    setActiveThreadId(id);
    setMessages(data.messages ?? []);
    setThreadMemorySets(data.memorySets ?? []);
    setMemorySets(data.allSets ?? []);
  }, []);

  const createThread = useCallback(async () => {
    const res = await fetch("/api/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", title: "New session" }),
    });
    const data = await res.json();
    await refreshThreads();
    if (data.thread?.id) await selectThread(data.thread.id);
  }, [refreshThreads, selectThread]);

  const updateThreadLocal = useCallback(
    async (id: string, patch: Partial<Thread>) => {
      const res = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", id, patch }),
      });
      const data = await res.json();
      if (data.thread) {
        setThreads((t) => t.map((x) => (x.id === id ? data.thread : x)));
        if (activeThreadId === id) await selectThread(id);
      }
    },
    [activeThreadId, selectThread]
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
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: activeThreadId, userMessage: text }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages((m) => {
          const withoutTmp = m.filter((x) => x.id !== optimistic.id);
          const hasUser = withoutTmp.some(
            (x) => x.role === "user" && x.content === text
          );
          return hasUser
            ? [...withoutTmp, data.message]
            : [...withoutTmp, optimistic, data.message];
        });
      }
    },
    [activeThreadId]
  );

  const requestCheckIn = useCallback(async () => {
    if (!activeThreadId) return;
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId: activeThreadId, afterSet: true }),
    });
    const data = await res.json();
    if (data.message) {
      setMessages((m) => [...m, data.message]);
    }
  }, [activeThreadId]);

  const bootstrapAgent = useCallback(async () => {
    if (!activeThreadId) return;
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId: activeThreadId, bootstrap: true }),
    });
    const data = await res.json();
    if (data.message) setMessages([data.message]);
  }, [activeThreadId]);

  const refreshSettings = useCallback(async () => {
    const res = await fetch("/api/settings");
    const data = await res.json();
    setSettings(data.settings ?? DEFAULT_SETTINGS);
    setMemories(data.memories ?? []);
    setMemorySets(data.memorySets ?? []);
  }, []);

  const saveSettings = useCallback(async (s: AppSettings) => {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save_settings", settings: s }),
    });
    const data = await res.json();
    setSettings(data.settings);
  }, []);

  const refreshMemories = refreshSettings;

  const setThreadMemorySet = useCallback(
    async (setId: string, enabled: boolean) => {
      if (!activeThreadId) return;
      const res = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set_memory",
          threadId: activeThreadId,
          setId,
          enabled,
        }),
      });
      const data = await res.json();
      setThreadMemorySets(data.memorySets ?? []);
    },
    [activeThreadId]
  );

  const setBls = useCallback((patch: Partial<BlsSettings>) => {
    setBlsState((b) => ({ ...b, ...patch }));
  }, []);

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
    if (activeThreadId && messages.length === 0) {
      void bootstrapAgent();
    }
  }, [activeThreadId, messages.length, bootstrapAgent]);

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

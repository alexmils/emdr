"use client";

import { useCallback, useEffect, useState } from "react";

export type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role?: string;
};

const USER_UPDATED = "emdr-user-updated";

export function notifyUserUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(USER_UPDATED));
  }
}

export function displayNameFor(user: CurrentUser | null): string {
  if (!user) return "You";
  if (user.name?.trim()) return user.name.trim();
  const local = user.email.split("@")[0];
  return local || "You";
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      const u = data.user;
      setUser(
        u
          ? {
              id: u.id,
              email: u.email,
              name: u.name ?? null,
              avatarUrl: u.avatarUrl ?? null,
              role: u.role,
            }
          : null
      );
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onUpdate = () => void refresh();
    window.addEventListener(USER_UPDATED, onUpdate);
    return () => window.removeEventListener(USER_UPDATED, onUpdate);
  }, [refresh]);

  return { user, loading, refresh };
}

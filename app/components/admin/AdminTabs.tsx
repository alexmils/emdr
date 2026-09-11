"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type AdminTabDef = { id: string; label: string };

export function useAdminTab<T extends string>(
  allowed: readonly T[],
  defaultTab: T
): [T, (id: T) => void] {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const raw = searchParams.get("tab");
  const tab = (
    raw && (allowed as readonly string[]).includes(raw) ? raw : defaultTab
  ) as T;

  const setTab = useCallback(
    (id: T) => {
      const next = new URLSearchParams(searchParams.toString());
      if (id === defaultTab) next.delete("tab");
      else next.set("tab", id);
      const q = next.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [searchParams, router, pathname, defaultTab]
  );

  return [tab, setTab];
}

export function AdminTabs({
  tabs,
  value,
  onChange,
  className = "",
}: {
  tabs: readonly AdminTabDef[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      className={`admin-tabs${className ? ` ${className}` : ""}`}
      role="tablist"
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={value === t.id}
          className={`admin-tab ${value === t.id ? "admin-tab-active" : ""}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

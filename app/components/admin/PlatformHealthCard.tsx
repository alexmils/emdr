"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminGauge } from "@/app/components/admin/AdminCharts";
import { fetchJson } from "@/lib/fetch-json";
import {
  HEALTH_PATH,
  HEALTH_POLL_MS,
  coolifyChipLabel,
  emptyCoolifyView,
  type AdminHealthPayload,
} from "@/lib/health-shared";

function gaugeCopy(status: AdminHealthPayload["status"] | "loading"): {
  display: string;
  label: string;
  tone: "ok" | "warn" | "down";
} {
  if (status === "ok") {
    return { display: "OK", label: `GET ${HEALTH_PATH}`, tone: "ok" };
  }
  if (status === "degraded") {
    return { display: "Degraded", label: `GET ${HEALTH_PATH}`, tone: "warn" };
  }
  if (status === "down") {
    return { display: "Down", label: `GET ${HEALTH_PATH}`, tone: "down" };
  }
  return { display: "…", label: `GET ${HEALTH_PATH}`, tone: "ok" };
}

function formatCheckedAt(iso: string | null): string {
  if (!iso) return "Waiting for first check";
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "Waiting for first check";
  const ago = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (ago < 5) return "Checked just now";
  if (ago < 60) return `Checked ${ago}s ago`;
  const mins = Math.round(ago / 60);
  return `Checked ${mins}m ago`;
}

export function PlatformHealthCard() {
  const [health, setHealth] = useState<AdminHealthPayload | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await fetchJson<AdminHealthPayload>("/api/admin/health", {
        cache: "no-store",
        signal,
      });
      if (signal?.aborted) return;
      setHealth(data);
      setError(false);
    } catch (err) {
      if (signal?.aborted) return;
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error(err);
      setError(true);
    }
  }, []);

  useEffect(() => {
    const abort = new AbortController();
    void load(abort.signal);
    const id = window.setInterval(() => {
      void load(abort.signal);
    }, HEALTH_POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") void load(abort.signal);
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      abort.abort();
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  const status = error ? "down" : health?.status ?? "loading";
  const score = error ? 0 : health?.score ?? 0;
  const liveTone = status === "ok" ? "ok" : status === "degraded" ? "warn" : status === "down" ? "down" : "ok";
  const copy = gaugeCopy(status);
  const coolify = health?.checks.coolify ?? emptyCoolifyView(false);
  const dbOk = health?.checks.db.ok === true && !error;
  const appOk = !error && health?.checks.app.ok !== false;

  return (
    <section className="admin-panel admin-dash-gauge-card">
      <div className="admin-panel-head-row">
        <h2 className="admin-panel-title">Platform health</h2>
        <span
          className={`admin-health-live${
            liveTone === "down"
              ? " is-down"
              : liveTone === "warn"
                ? " is-warn"
                : ""
          }`}
        >
          <i className="admin-health-live-dot" aria-hidden />
          Live
        </span>
      </div>
      <AdminGauge
        value={score}
        display={copy.display}
        label={copy.label}
        tone={copy.tone}
      />
      <div className="admin-health-chips admin-dash-health-chips">
        <span
          className={`admin-health-chip ${
            appOk ? "admin-health-ok" : "admin-health-warn"
          }`}
        >
          App {appOk ? "ok" : "down"}
        </span>
        <span
          className={`admin-health-chip ${
            dbOk ? "admin-health-ok" : "admin-health-warn"
          }`}
        >
          Database {dbOk ? "ok" : "down"}
        </span>
        <span
          className={`admin-health-chip ${
            !coolify.configured
              ? "admin-health-neutral"
              : coolify.ok
                ? "admin-health-ok"
                : "admin-health-warn"
          }`}
        >
          {coolifyChipLabel(coolify)}
        </span>
      </div>
      <p className="admin-health-meta">
        {error
          ? "Could not reach the health API"
          : formatCheckedAt(health?.checkedAt ?? null)}
      </p>
    </section>
  );
}

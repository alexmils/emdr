"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/app/components/admin/AdminPageHeader";
import { actionLabel, formatDateTime } from "@/lib/admin-format";
import type { AuditEvent } from "@/lib/audit-log";
import { fetchJson } from "@/lib/fetch-json";

const ACTION_OPTIONS = [
  { value: "all", label: "All actions" },
  { value: "user.login", label: "Signed in" },
  { value: "user.logout", label: "Signed out" },
  { value: "user.invited", label: "Invited" },
  { value: "user.updated", label: "Updated" },
  { value: "user.deleted", label: "Deleted" },
  { value: "user.disabled", label: "Disabled" },
  { value: "user.enabled", label: "Enabled" },
  { value: "settings.platform_updated", label: "Platform settings" },
  { value: "email.test_sent", label: "Test email" },
  { value: "email.broadcast_sent", label: "Broadcast" },
];

export default function AdminActivityPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [actionFilter, setActionFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams({ limit: "100" });
    if (actionFilter !== "all") params.set("action", actionFilter);
    if (search.trim()) params.set("search", search.trim());
    const res = await fetchJson<{ events: AuditEvent[] }>(
      `/api/admin/events?${params.toString()}`
    );
    setEvents(res.events ?? []);
  }, [actionFilter, search]);

  useEffect(() => {
    void (async () => {
      try {
        await load();
      } catch (err) {
        console.error(err);
        setError("Could not load activity.");
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  const filtered = useMemo(() => events, [events]);

  if (loading) {
    return (
      <div className="admin-page flex min-h-screen items-center justify-center">
        <p className="text-[var(--text-secondary)]">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page flex min-h-screen items-center justify-center p-6">
        <p className="text-[var(--destructive)]">{error}</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Activity"
        subtitle="Sign-ins, invites, account and settings changes."
      />
      <main className="admin-main">
        <section className="admin-panel">
          <div className="admin-filters">
            <input
              type="search"
              placeholder="Search actor, target, or action"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onBlur={() => void load()}
              className="field admin-filter-field"
            />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="field admin-filter-field"
            >
              {ACTION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn-secondary shrink-0"
              onClick={() => void load()}
            >
              Apply
            </button>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Target</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="admin-table-empty">
                      No events yet
                    </td>
                  </tr>
                )}
                {filtered.map((ev) => (
                  <tr key={ev.id}>
                    <td>{formatDateTime(ev.createdAt)}</td>
                    <td>{actionLabel(ev.action)}</td>
                    <td>{ev.actorEmail ?? "—"}</td>
                    <td>
                      {ev.targetEmail && ev.targetEmail !== ev.actorEmail
                        ? ev.targetEmail
                        : "—"}
                    </td>
                    <td className="text-[var(--text-muted)]">
                      {ev.ip ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

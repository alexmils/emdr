"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/app/components/admin/AdminPageHeader";
import { InviteForm } from "@/app/components/admin/InviteForm";
import { actionLabel, formatDateTime, formatMoney } from "@/lib/admin-format";
import type { AdminDashboardStats } from "@/lib/admin-stats";
import type { AuditEvent } from "@/lib/audit-log";
import { fetchJson } from "@/lib/fetch-json";

type HealthStatus = {
  brevoConfigured: boolean;
  gmailFallbackConfigured: boolean;
  appUrl: string;
  fromAddress: string | null;
  fromName: string | null;
};

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [statsRes, eventsRes, healthRes] = await Promise.all([
      fetchJson<{ stats: AdminDashboardStats }>("/api/admin/stats"),
      fetchJson<{ events: AuditEvent[] }>("/api/admin/events?limit=8"),
      fetchJson<{ status: HealthStatus }>("/api/admin/email/status"),
    ]);
    setStats(statsRes.stats);
    setEvents(eventsRes.events ?? []);
    setHealth(healthRes.status);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await load();
      } catch (err) {
        console.error(err);
        setError("Could not load overview.");
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  if (loading) {
    return (
      <div className="admin-page flex min-h-screen items-center justify-center">
        <p className="text-[var(--text-secondary)]">Loading…</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="admin-page flex min-h-screen items-center justify-center p-6">
        <p className="text-[var(--destructive)]">{error || "Unavailable"}</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Overview"
        subtitle="Platform health, usage, and recent activity."
      />
      <main className="admin-main">
        <section className="admin-stat-grid">
          <article className="admin-stat-card">
            <p className="admin-stat-label">Users</p>
            <p className="admin-stat-value">{stats.users.total}</p>
            <p className="admin-stat-hint">
              +{stats.users.newThisMonth} this month
            </p>
          </article>
          <article className="admin-stat-card">
            <p className="admin-stat-label">Sessions</p>
            <p className="admin-stat-value">{stats.sessions.totalThreads}</p>
            <p className="admin-stat-hint">All user threads</p>
          </article>
          <article className="admin-stat-card">
            <p className="admin-stat-label">Messages (month)</p>
            <p className="admin-stat-value">
              {stats.sessions.messagesThisMonth}
            </p>
          </article>
          <article className="admin-stat-card">
            <p className="admin-stat-label">Paying</p>
            <p className="admin-stat-value">{stats.billing.activePaid}</p>
            <p className="admin-stat-hint">
              MRR {formatMoney(stats.billing.mrrCents, stats.billing.currency)}
            </p>
          </article>
          <article className="admin-stat-card">
            <p className="admin-stat-label">Admins</p>
            <p className="admin-stat-value">{stats.users.admins}</p>
            <p className="admin-stat-hint">Platform administrators</p>
          </article>
        </section>

        {health && (
          <section className="admin-panel">
            <h2 className="admin-panel-title">Health</h2>
            <div className="admin-health-chips">
              <span
                className={`admin-health-chip ${
                  health.brevoConfigured ? "admin-health-ok" : "admin-health-warn"
                }`}
              >
                Brevo {health.brevoConfigured ? "configured" : "not configured"}
              </span>
              <span
                className={`admin-health-chip ${
                  health.gmailFallbackConfigured
                    ? "admin-health-ok"
                    : "admin-health-warn"
                }`}
              >
                Gmail fallback{" "}
                {health.gmailFallbackConfigured ? "ready" : "not configured"}
              </span>
              <span className="admin-health-chip admin-health-neutral">
                App URL {health.appUrl}
              </span>
              {health.fromAddress && (
                <span className="admin-health-chip admin-health-neutral">
                  From {health.fromName} &lt;{health.fromAddress}&gt;
                </span>
              )}
            </div>
          </section>
        )}

        <div className="admin-two-col">
          <section className="admin-panel">
            <h2 className="admin-panel-title">Quick invite</h2>
            <p className="admin-panel-sub">
              Sends an invite email with a create-password link.
            </p>
            <InviteForm onSuccess={() => void load()} />
          </section>

          <section className="admin-panel">
            <div className="admin-panel-head-row">
              <h2 className="admin-panel-title">Recent activity</h2>
              <Link href="/admin/activity" className="admin-link">
                View all
              </Link>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Action</th>
                    <th>Actor</th>
                  </tr>
                </thead>
                <tbody>
                  {events.length === 0 && (
                    <tr>
                      <td colSpan={3} className="admin-table-empty">
                        No events yet
                      </td>
                    </tr>
                  )}
                  {events.map((ev) => (
                    <tr key={ev.id}>
                      <td>{formatDateTime(ev.createdAt)}</td>
                      <td>{actionLabel(ev.action)}</td>
                      <td>{ev.actorEmail ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

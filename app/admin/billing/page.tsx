"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/app/components/admin/AdminPageHeader";
import { formatDateTime, formatMoney } from "@/lib/admin-format";
import type { AdminBillingRow } from "@/lib/stripe-admin";
import type { UserUsageRow } from "@/lib/usage";
import { fetchJson } from "@/lib/fetch-json";

export default function AdminBillingPage() {
  const [rows, setRows] = useState<AdminBillingRow[]>([]);
  const [usage, setUsage] = useState<UserUsageRow[]>([]);
  const [stripeConfigured, setStripeConfigured] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [billingRes, usageRes] = await Promise.all([
      fetchJson<{ rows: AdminBillingRow[]; stripeConfigured: boolean }>(
        "/api/admin/billing"
      ),
      fetchJson<{ usage: UserUsageRow[] }>("/api/admin/usage"),
    ]);
    setRows(billingRes.rows ?? []);
    setStripeConfigured(billingRes.stripeConfigured ?? false);
    setUsage(usageRes.usage ?? []);
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

  const totalMrr = rows.reduce(
    (sum, r) => (r.status === "active" && r.plan !== "free" ? sum + r.amountCents : sum),
    0
  );

  if (loading) {
    return (
      <div className="admin-page flex min-h-screen items-center justify-center">
        <p className="text-[var(--text-secondary)]">Loading…</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Billing"
        subtitle="Subscriptions, MRR, and usage overview."
      />
      <main className="admin-main">
        <section className="admin-stat-grid">
          <article className="admin-stat-card">
            <p className="admin-stat-label">MRR</p>
            <p className="admin-stat-value">{formatMoney(totalMrr)}</p>
          </article>
          <article className="admin-stat-card">
            <p className="admin-stat-label">Stripe</p>
            <p className="admin-stat-value">{stripeConfigured ? "Live" : "Off"}</p>
            <p className="admin-stat-hint">
              {stripeConfigured
                ? "Webhook + checkout configured"
                : "Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET"}
            </p>
          </article>
        </section>

        {!stripeConfigured && (
          <section className="admin-panel">
            <p className="admin-panel-sub">
              User billing checkout is available when Stripe env vars are set.
              See{" "}
              <Link href="/billing" className="admin-link">
                user billing page
              </Link>{" "}
              for the client-facing stub until checkout is wired.
            </p>
          </section>
        )}

        <section className="admin-panel">
          <h2 className="admin-panel-title">Subscriptions</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Renews</th>
                  <th>Stripe</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="admin-table-empty">
                      No subscriptions yet
                    </td>
                  </tr>
                )}
                {rows.map((r) => (
                  <tr key={r.userId}>
                    <td>
                      <Link
                        href={`/admin/users/${r.userId}`}
                        className="admin-link"
                      >
                        {r.email}
                      </Link>
                    </td>
                    <td>{r.plan}</td>
                    <td>{r.status}</td>
                    <td>{formatMoney(r.amountCents, r.currency)}</td>
                    <td>{formatDateTime(r.renewsAt)}</td>
                    <td className="text-[var(--text-muted)]">
                      {r.stripeSubscriptionId ? "Linked" : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-panel">
          <h2 className="admin-panel-title">Usage</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Threads</th>
                  <th>Messages</th>
                  <th>Last activity</th>
                </tr>
              </thead>
              <tbody>
                {usage.map((u) => (
                  <tr key={u.userId}>
                    <td>
                      <Link
                        href={`/admin/users/${u.userId}`}
                        className="admin-link"
                      >
                        {u.email}
                      </Link>
                    </td>
                    <td>{u.threadCount}</td>
                    <td>{u.messageCount}</td>
                    <td>{formatDateTime(u.lastActivityAt)}</td>
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

"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Download,
  History,
  Lightbulb,
  Mail,
  MoreHorizontal,
  RefreshCw,
  Settings2,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import {
  AdminDonut,
  AdminLineChart,
  CHART_SLICE_COLORS,
} from "@/app/components/admin/AdminCharts";
import { AdminTabs, useAdminTab } from "@/app/components/admin/AdminTabs";
import {
  financeCsv,
  financePlanLabel,
  formatFinanceDate,
  formatMoneyCompact,
  formatMoneyDelta,
  formatUpdatedAgo,
  stripeBannerCopy,
  type AdminFinanceDashboard,
} from "@/lib/admin-finance-format";
import { formatDateTime, formatMoney, paymentStatusLabel } from "@/lib/admin-format";
import { formatUsdMicros } from "@/lib/admin-llm-format";
import { fetchJson } from "@/lib/fetch-json";

const TABS = ["dashboard", "plans", "payments"] as const;
type Tab = (typeof TABS)[number];
const TAB_ITEMS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "plans", label: "Plans" },
  { id: "payments", label: "Payments" },
] as const;

const SHORTCUTS = [
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/billing", label: "Billing", icon: CreditCard },
  { href: "/admin/billing?tab=subscriptions", label: "Plans", icon: Wallet },
  { href: "/admin/activity", label: "History", icon: History },
  { href: "/admin/email", label: "Email", icon: Mail },
  { href: "/admin/ai", label: "AI", icon: Lightbulb },
  { href: "/admin/billing?tab=usage", label: "Usage", icon: Sparkles },
  { href: "/admin/platform", label: "More", icon: MoreHorizontal },
] as const;

function PctChip({
  current,
  previous,
  invert = false,
}: {
  current: number;
  previous: number;
  invert?: boolean;
}) {
  if (previous <= 0 && current <= 0) return null;
  const delta =
    previous <= 0
      ? current > 0
        ? 100
        : 0
      : Math.round(((current - previous) / previous) * 1000) / 10;
  if (delta === 0) {
    return <span className="admin-fin-chip">0%</span>;
  }
  const up = invert ? delta < 0 : delta > 0;
  return (
    <span className={`admin-fin-chip ${up ? "admin-fin-chip-up" : "admin-fin-chip-down"}`}>
      {delta > 0 ? "+" : ""}
      {delta}%
    </span>
  );
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function AdminFinancePageInner() {
  const router = useRouter();
  const [tab, setTab] = useAdminTab(TABS, "dashboard");
  const [data, setData] = useState<AdminFinanceDashboard | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<"weekly" | "monthly">("weekly");
  const [lookup, setLookup] = useState("");
  const [lookupMsg, setLookupMsg] = useState("");

  const load = useCallback(async () => {
    const res = await fetchJson<{ finance: AdminFinanceDashboard }>(
      "/api/admin/finance"
    );
    setData(res.finance);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await load();
      } catch (err) {
        console.error(err);
        setError("Could not load finances.");
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  const banner = useMemo(
    () => (data ? stripeBannerCopy(data.stripe) : null),
    [data]
  );

  const series = useMemo(() => {
    if (!data) return [];
    const points = range === "weekly" ? data.series7d : data.seriesMonthly;
    return points.map((p) => ({ label: p.label, value: p.collectedCents }));
  }, [data, range]);

  const allocationSlices = useMemo(() => {
    if (!data) return [];
    const rows = data.allocation.filter((s) => s.amountCents > 0);
    if (rows.length === 0) {
      return [
        {
          key: "empty",
          label: "No paid plans yet",
          value: 1,
          color: "#dcebc4",
        },
      ];
    }
    return rows.map((s, i) => ({
      key: s.key,
      label: s.label,
      value: s.amountCents,
      color: CHART_SLICE_COLORS[i % CHART_SLICE_COLORS.length],
    }));
  }, [data]);

  const exportCurrent = () => {
    if (!data) return;
    const day = data.generatedAt.slice(0, 10);
    if (tab === "payments") {
      downloadCsv(
        `nura-payments-${day}.csv`,
        financeCsv([
          ["occurred", "email", "status", "amount_cents", "currency", "mode"],
          ...data.payments.map((p) => [
            p.occurredAt,
            p.email,
            p.status,
            p.amountCents,
            p.currency,
            p.livemode === true ? "live" : p.livemode === false ? "demo" : "",
          ]),
        ])
      );
      return;
    }
    if (tab === "plans") {
      downloadCsv(
        `nura-plans-${day}.csv`,
        financeCsv([
          ["plan", "subscribers", "mrr_cents", "share_pct"],
          ...data.allocation.map((s) => [
            s.label,
            s.count,
            s.amountCents,
            s.pct,
          ]),
        ])
      );
      return;
    }
    downloadCsv(
      `nura-finances-${day}.csv`,
      financeCsv([
        ["metric", "value"],
        ["mrr_cents", data.kpis.mrrCents],
        ["collected_this_month_cents", data.kpis.collectedThisMonthCents],
        ["ai_spend_usd_micros", data.kpis.aiSpendUsdMicros],
        ["paid_share_pct", data.kpis.paidSharePct],
        ["active_paid", data.kpis.activePaid],
        ["due_this_month", data.dueThisMonth],
      ])
    );
  };

  const openSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    const q = lookup.trim().toLowerCase();
    if (!q) {
      setLookupMsg("Enter an email.");
      return;
    }
    const hit = data.lookup.find(
      (u) =>
        u.email.toLowerCase() === q ||
        (u.name && u.name.toLowerCase() === q)
    );
    if (hit) {
      setLookupMsg("");
      router.push(`/admin/users/${hit.userId}`);
      return;
    }
    try {
      const usersRes = await fetchJson<{
        users: { id: string; email: string; name: string | null }[];
      }>("/api/admin/users?limit=100");
      const found = (usersRes.users ?? []).find(
        (u) =>
          u.email.toLowerCase() === q ||
          (u.name && u.name.toLowerCase() === q)
      );
      if (found) {
        setLookupMsg("");
        router.push(`/admin/users/${found.id}`);
        return;
      }
    } catch {
      // fall through to the same empty message
    }
    setLookupMsg("No subscriber with that email.");
  };

  if (loading) {
    return (
      <div className="admin-page flex min-h-screen items-center justify-center">
        <p className="text-[var(--text-secondary)]">Loading finances…</p>
      </div>
    );
  }

  if (error || !data || !banner) {
    return (
      <div className="admin-page flex min-h-screen items-center justify-center p-6">
        <p className="text-[var(--destructive)]">{error || "Unavailable"}</p>
      </div>
    );
  }

  const currency = data.currency || "USD";
  const maxSource = Math.max(1, ...data.incomeSources.map((s) => s.amountCents));

  return (
    <div className="admin-page admin-fin">
      <header className="admin-fin-header">
        <div>
          <h1 className="admin-page-title">Finances</h1>
          <p className="admin-page-subtitle">{formatFinanceDate(data.generatedAt)}</p>
        </div>
      </header>

      <main className="admin-main admin-fin-main">
        <div className="admin-fin-toolbar">
          <AdminTabs tabs={TAB_ITEMS} value={tab} onChange={(id) => setTab(id as Tab)} />
          <div className="admin-fin-actions">
            <button type="button" className="admin-fin-ghost" onClick={() => void load()}>
              <RefreshCw size={14} strokeWidth={1.75} />
              {formatUpdatedAgo(data.generatedAt)}
            </button>
            <Link href="/admin/billing?tab=stripe" className="admin-fin-ghost">
              <Settings2 size={14} strokeWidth={1.75} />
              Settings
            </Link>
            <button type="button" className="admin-fin-ghost" onClick={exportCurrent}>
              <Download size={14} strokeWidth={1.75} />
              Export
            </button>
          </div>
        </div>

        {tab === "dashboard" && (
          <>
            <section className="admin-fin-top">
              <div className="admin-fin-kpi-card">
                <article className="admin-fin-kpi-cell">
                  <p className="admin-fin-label">Recurring</p>
                  <div className="admin-fin-kpi-row">
                    <p className="admin-fin-value">
                      {formatMoneyCompact(data.kpis.mrrCents, currency)}
                    </p>
                  </div>
                  <p className="admin-fin-hint">
                    {data.kpis.activePaid} paying · monthly run-rate
                  </p>
                </article>
                <article className="admin-fin-kpi-cell">
                  <p className="admin-fin-label">Collected</p>
                  <div className="admin-fin-kpi-row">
                    <p className="admin-fin-value">
                      {formatMoneyCompact(
                        data.kpis.collectedThisMonthCents,
                        currency
                      )}
                    </p>
                    <PctChip
                      current={data.kpis.collectedThisMonthCents}
                      previous={data.kpis.collectedLastMonthCents}
                    />
                  </div>
                  <p className="admin-fin-hint">
                    {formatMoneyDelta(
                      data.kpis.collectedThisMonthCents -
                        data.kpis.collectedLastMonthCents,
                      currency
                    )}
                  </p>
                </article>
                <article className="admin-fin-kpi-cell">
                  <p className="admin-fin-label">AI spend</p>
                  <div className="admin-fin-kpi-row">
                    <p className="admin-fin-value">
                      {formatUsdMicros(data.kpis.aiSpendUsdMicros)}
                    </p>
                    <PctChip
                      current={data.kpis.aiSpendUsdMicros}
                      previous={data.kpis.aiSpendLastMonthUsdMicros}
                      invert
                    />
                  </div>
                  <p className="admin-fin-hint">Model cost this month</p>
                </article>
                <article className="admin-fin-kpi-cell">
                  <p className="admin-fin-label">Paid share</p>
                  <div className="admin-fin-kpi-row">
                    <p className="admin-fin-value">{data.kpis.paidSharePct}%</p>
                  </div>
                  <p className="admin-fin-hint">
                    {data.kpis.activePaid} of {data.kpis.totalUsers} users
                  </p>
                </article>
              </div>

              <div className="admin-fin-right-stack">
                <section className="admin-fin-card">
                  <h2 className="admin-fin-card-title">Income by plan</h2>
                  <div className="admin-fin-sources">
                    {data.incomeSources.map((s) => (
                      <div key={s.key} className="admin-fin-source">
                        <p className="admin-fin-source-meta">
                          {s.label} · {s.pct}%
                        </p>
                        <p className="admin-fin-source-amt">
                          {formatMoney(s.amountCents, currency)}
                        </p>
                        <div className="admin-fin-source-track" aria-hidden>
                          <span
                            className="admin-fin-source-fill"
                            style={{
                              height: `${Math.max(8, (s.amountCents / maxSource) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
                <aside className={`admin-fin-banner admin-fin-banner-${banner.tone}`}>
                  <div>
                    <p className="admin-fin-banner-title">{banner.title}</p>
                    <p className="admin-fin-banner-body">{banner.body}</p>
                  </div>
                  <Link href="/admin/billing?tab=stripe" className="admin-fin-banner-cta">
                    {banner.cta}
                  </Link>
                </aside>
              </div>
            </section>

            <section className="admin-fin-mid">
              <section className="admin-fin-card">
                <div className="admin-fin-card-head">
                  <h2 className="admin-fin-card-title">Revenue</h2>
                  <select
                    className="admin-fin-select"
                    value={range}
                    aria-label="Revenue range"
                    onChange={(e) =>
                      setRange(e.target.value === "monthly" ? "monthly" : "weekly")
                    }
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <AdminLineChart
                  points={series}
                  ariaLabel={
                    range === "weekly"
                      ? "Collected payments this week"
                      : "Collected payments by week"
                  }
                />
              </section>

              <section className="admin-fin-card">
                <div className="admin-fin-card-head">
                  <h2 className="admin-fin-card-title">Allocation</h2>
                  <span className="admin-fin-muted">{currency} recurring</span>
                </div>
                <div className="admin-fin-alloc">
                  <AdminDonut
                    slices={allocationSlices}
                    centerLabel="Total"
                    centerValue={formatMoneyCompact(data.kpis.mrrCents, currency)}
                    ariaLabel="Recurring revenue by plan"
                  />
                  <ul className="admin-fin-legend">
                    {data.allocation.map((s, i) => (
                      <li key={s.key}>
                        <i
                          className="admin-dash-swatch"
                          style={{
                            background:
                              CHART_SLICE_COLORS[i % CHART_SLICE_COLORS.length],
                          }}
                        />
                        <span>{s.label}</span>
                        <strong>{formatMoney(s.amountCents, currency)}</strong>
                        <em>{s.pct}%</em>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            </section>

            <section className="admin-fin-bottom">
              <section className="admin-fin-card">
                <h2 className="admin-fin-card-title">Stripe</h2>
                <ul className="admin-fin-wallet">
                  {data.wallets.map((w) => (
                    <li key={w.id}>
                      <span className="admin-fin-mark" aria-hidden>
                        {w.mark}
                      </span>
                      <div>
                        <p className="admin-fin-wallet-name">{w.label}</p>
                        <p className="admin-fin-hint">{w.detail}</p>
                      </div>
                      <div className="admin-fin-wallet-right">
                        <p className="admin-fin-wallet-amt">{w.amountLabel}</p>
                        {w.badge ? (
                          <span className="admin-fin-badge">{w.badge}</span>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="admin-fin-card">
                <h2 className="admin-fin-card-title">Renewals</h2>
                <p className="admin-fin-value admin-fin-value-sm">
                  {formatMoneyCompact(data.upcomingTotalCents, currency)}
                </p>
                <p className="admin-fin-hint">
                  {data.dueThisMonth} {data.dueThisMonth === 1 ? "bill" : "bills"} due this month
                </p>
                {data.autopayTodayCents > 0 ? (
                  <p className="admin-fin-autopay">
                    Autopay will collect {formatMoney(data.autopayTodayCents, currency)} today
                  </p>
                ) : null}
                <ul className="admin-fin-renewals">
                  {data.upcoming.length === 0 ? (
                    <li className="admin-fin-empty">No upcoming renewals.</li>
                  ) : (
                    data.upcoming.map((r) => (
                      <li key={`${r.userId}-${r.renewsAt}`}>
                        <Link href={`/admin/users/${r.userId}`}>
                          <span className="admin-fin-mark admin-fin-mark-sm" aria-hidden>
                            {(r.name || r.email).slice(0, 1).toUpperCase()}
                          </span>
                          <div>
                            <p className="admin-fin-wallet-name">
                              {r.name || r.email}
                            </p>
                            <p className="admin-fin-hint">
                              {financePlanLabel(r.plan)} · {formatDateTime(r.renewsAt)}
                            </p>
                          </div>
                          <span className="admin-fin-chevron" aria-hidden>
                            ›
                          </span>
                        </Link>
                      </li>
                    ))
                  )}
                </ul>
              </section>

              <div className="admin-fin-right-stack">
                <section className="admin-fin-card">
                  <div className="admin-fin-card-head">
                    <h2 className="admin-fin-card-title">Find a subscriber</h2>
                    <span className="admin-fin-muted">{currency}</span>
                  </div>
                  <form className="admin-fin-lookup" onSubmit={(e) => void openSubscriber(e)}>
                    <input
                      type="email"
                      value={lookup}
                      onChange={(e) => {
                        setLookup(e.target.value);
                        setLookupMsg("");
                      }}
                      placeholder="name@email.com"
                      aria-label="Subscriber email"
                    />
                    <button type="submit">Open</button>
                  </form>
                  {lookupMsg ? (
                    <p className="admin-fin-lookup-msg">{lookupMsg}</p>
                  ) : null}
                </section>
                <section className="admin-fin-card">
                  <h2 className="admin-fin-card-title">Shortcuts</h2>
                  <div className="admin-fin-shortcuts">
                    {SHORTCUTS.map((s) => {
                      const Icon = s.icon;
                      return (
                        <Link key={s.href} href={s.href} className="admin-fin-shortcut">
                          <span className="admin-fin-shortcut-icon">
                            <Icon size={18} strokeWidth={1.7} />
                          </span>
                          {s.label}
                        </Link>
                      );
                    })}
                  </div>
                </section>
              </div>
            </section>
          </>
        )}

        {tab === "plans" && (
          <section className="admin-fin-card">
            <h2 className="admin-fin-card-title">Plan mix</h2>
            <p className="admin-fin-hint">
              Recurring from active paid plans. Yearly is divided by 12; weekly is ×52÷12.
            </p>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Plan</th>
                    <th>Subscribers</th>
                    <th>Recurring</th>
                    <th>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {data.allocation.map((s) => (
                    <tr key={s.key}>
                      <td>{s.label}</td>
                      <td>{s.count}</td>
                      <td>{formatMoney(s.amountCents, currency)}</td>
                      <td>{s.pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === "payments" && (
          <section className="admin-fin-card">
            <h2 className="admin-fin-card-title">Payments</h2>
            <p className="admin-fin-hint">Latest Stripe checkout and invoice events.</p>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Person</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Mode</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="admin-table-empty">
                        No payments yet.
                      </td>
                    </tr>
                  ) : (
                    data.payments.map((p) => (
                      <tr key={p.id}>
                        <td>{formatDateTime(p.occurredAt)}</td>
                        <td>
                          <Link href={`/admin/users/${p.userId}`}>
                            {p.name || p.email}
                          </Link>
                        </td>
                        <td>{paymentStatusLabel(p.status)}</td>
                        <td>{formatMoney(p.amountCents, p.currency)}</td>
                        <td>
                          {p.livemode === true
                            ? "Live"
                            : p.livemode === false
                              ? "Demo"
                              : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default function AdminFinancePage() {
  return (
    <Suspense
      fallback={
        <div className="admin-page flex min-h-screen items-center justify-center">
          <p className="text-[var(--text-secondary)]">Loading finances…</p>
        </div>
      }
    >
      <AdminFinancePageInner />
    </Suspense>
  );
}

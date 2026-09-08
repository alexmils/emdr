"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/app/components/admin/AdminPageHeader";
import { formatDateTime, formatMoney } from "@/lib/admin-format";
import type { AdminBillingRow } from "@/lib/stripe-admin";
import type { StripeAdminView } from "@/lib/stripe-admin-settings";
import type { PlatformStripeConfig } from "@/lib/platform-settings";
import type { UserUsageRow } from "@/lib/usage";
import { fetchJson } from "@/lib/fetch-json";

const EMPTY_STRIPE: StripeAdminView = {
  secretKey: "",
  webhookSecret: "",
  publishableKey: "",
  priceIdWeekly: "",
  priceIdMonthly: "",
  priceIdYearly: "",
  displayPriceWeekly: "€4.99",
  displayPriceMonthly: "€14.99",
  displayPriceYearly: "€99",
  hasSecretKey: false,
  hasWebhookSecret: false,
};

export default function AdminBillingPage() {
  const [rows, setRows] = useState<AdminBillingRow[]>([]);
  const [usage, setUsage] = useState<UserUsageRow[]>([]);
  const [stripeConfigured, setStripeConfigured] = useState(false);
  const [catalogReady, setCatalogReady] = useState(false);
  const [webhookReady, setWebhookReady] = useState(false);
  const [stripe, setStripe] = useState<StripeAdminView>(EMPTY_STRIPE);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState("");

  const applyStripeResponse = (res: {
    stripe?: StripeAdminView;
    stripeConfigured?: boolean;
    catalogReady?: boolean;
    webhookReady?: boolean;
  }) => {
    if (res.stripe) setStripe(res.stripe);
    if (typeof res.stripeConfigured === "boolean") {
      setStripeConfigured(res.stripeConfigured);
    }
    if (typeof res.catalogReady === "boolean") setCatalogReady(res.catalogReady);
    if (typeof res.webhookReady === "boolean") setWebhookReady(res.webhookReady);
  };

  const load = useCallback(async () => {
    const [billingRes, usageRes] = await Promise.all([
      fetchJson<{
        rows: AdminBillingRow[];
        stripeConfigured: boolean;
        catalogReady?: boolean;
        webhookReady?: boolean;
        stripe?: StripeAdminView;
        canEdit?: boolean;
      }>("/api/admin/billing"),
      fetchJson<{ usage: UserUsageRow[] }>("/api/admin/usage"),
    ]);
    setRows(billingRes.rows ?? []);
    setCanEdit(billingRes.canEdit ?? false);
    setUsage(usageRes.usage ?? []);
    applyStripeResponse(billingRes);
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

  const saveStripe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    setBusy(true);
    setMsg("");
    try {
      const patch: Partial<PlatformStripeConfig> = {
        publishableKey: stripe.publishableKey,
        priceIdWeekly: stripe.priceIdWeekly,
        priceIdMonthly: stripe.priceIdMonthly,
        priceIdYearly: stripe.priceIdYearly,
        displayPriceWeekly: stripe.displayPriceWeekly,
        displayPriceMonthly: stripe.displayPriceMonthly,
        displayPriceYearly: stripe.displayPriceYearly,
      };
      // Only send secrets when the admin typed a new non-empty value.
      if (stripe.secretKey.trim()) patch.secretKey = stripe.secretKey.trim();
      if (stripe.webhookSecret.trim()) {
        patch.webhookSecret = stripe.webhookSecret.trim();
      }
      const res = await fetchJson<{
        stripe: StripeAdminView;
        stripeConfigured: boolean;
        catalogReady?: boolean;
        webhookReady?: boolean;
      }>("/api/admin/billing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stripe: patch }),
      });
      applyStripeResponse(res);
      setMsg("Stripe settings saved.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const syncFromStripe = async () => {
    if (!canEdit) return;
    setSyncing(true);
    setMsg("");
    try {
      const res = await fetchJson<{
        stripe: StripeAdminView;
        stripeConfigured: boolean;
        catalogReady?: boolean;
        webhookReady?: boolean;
        summary?: string;
      }>("/api/admin/billing/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Empty → server uses saved key (leave-unchanged pattern).
          secretKey: stripe.secretKey.trim() || undefined,
          save: true,
        }),
      });
      applyStripeResponse(res);
      setMsg(
        res.summary
          ? `Synced from Stripe: ${res.summary}`
          : "Synced plan prices from Stripe."
      );
      if (!res.webhookReady) {
        setMsg((m) =>
          `${m} Add the webhook signing secret to finish Live checkout.`
        );
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const patch = (partial: Partial<PlatformStripeConfig>) =>
    setStripe((s) => ({ ...s, ...partial }));

  const canSync =
    canEdit && (Boolean(stripe.secretKey.trim()) || stripe.hasSecretKey);

  const totalMrr = rows.reduce(
    (sum, r) =>
      r.status === "active" && r.plan !== "free" ? sum + r.amountCents : sum,
    0
  );

  const stripeHint = stripeConfigured
    ? "Catalog + webhook ready"
    : catalogReady && !webhookReady
      ? "Prices synced — add webhook secret"
      : webhookReady && !catalogReady
        ? "Webhook set — add secret key + Price IDs (or Sync)"
        : "Configure Stripe below";

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
        subtitle="Stripe keys, plan prices, subscriptions, and usage."
      />
      <main className="admin-main">
        <section className="admin-stat-grid">
          <article className="admin-stat-card">
            <p className="admin-stat-label">MRR</p>
            <p className="admin-stat-value">{formatMoney(totalMrr)}</p>
          </article>
          <article className="admin-stat-card">
            <p className="admin-stat-label">Stripe</p>
            <p className="admin-stat-value">
              {stripeConfigured ? "Live" : "Off"}
            </p>
            <p className="admin-stat-hint">{stripeHint}</p>
          </article>
        </section>

        <form
          className="admin-form-stack admin-panel"
          onSubmit={(e) => void saveStripe(e)}
        >
          <h2 className="admin-panel-title">Stripe configuration</h2>
          <p className="admin-panel-sub">
            Keys and Price IDs are stored in platform settings. Use{" "}
            <strong>Sync from Stripe</strong> to pull active weekly / monthly /
            yearly prices (prefers <code className="admin-code">app=nurahelp</code>{" "}
            product metadata). Webhook URL:{" "}
            <code className="admin-code">/api/webhooks/stripe</code>
            {canEdit
              ? " — leave secret fields blank to keep the saved value."
              : " — view only (secrets hidden; platform admin can edit)."}
          </p>

          <label className="admin-field-label">
            Secret key
            <input
              type="password"
              autoComplete="off"
              value={stripe.secretKey}
              disabled={!canEdit}
              onChange={(e) => patch({ secretKey: e.target.value })}
              className="field"
              placeholder={
                stripe.hasSecretKey
                  ? "•••• saved — paste to replace"
                  : "rk_test_… or sk_test_…"
              }
            />
          </label>
          <label className="admin-field-label">
            Webhook signing secret
            <input
              type="password"
              autoComplete="off"
              value={stripe.webhookSecret}
              disabled={!canEdit}
              onChange={(e) => patch({ webhookSecret: e.target.value })}
              className="field"
              placeholder={
                stripe.hasWebhookSecret
                  ? "•••• saved — paste to replace"
                  : "whsec_…"
              }
            />
          </label>
          <label className="admin-field-label">
            Publishable key (optional)
            <input
              type="text"
              value={stripe.publishableKey}
              disabled={!canEdit}
              onChange={(e) => patch({ publishableKey: e.target.value })}
              className="field"
              placeholder="pk_test_…"
            />
          </label>

          <h3 className="admin-panel-title" style={{ marginTop: "1rem" }}>
            Plans
          </h3>
          <div className="admin-stat-grid">
            {(
              [
                {
                  label: "Weekly",
                  priceId: stripe.priceIdWeekly,
                  display: stripe.displayPriceWeekly,
                  onPriceId: (v: string) => patch({ priceIdWeekly: v }),
                  onDisplay: (v: string) => patch({ displayPriceWeekly: v }),
                },
                {
                  label: "Monthly",
                  priceId: stripe.priceIdMonthly,
                  display: stripe.displayPriceMonthly,
                  onPriceId: (v: string) => patch({ priceIdMonthly: v }),
                  onDisplay: (v: string) => patch({ displayPriceMonthly: v }),
                },
                {
                  label: "Yearly",
                  priceId: stripe.priceIdYearly,
                  display: stripe.displayPriceYearly,
                  onPriceId: (v: string) => patch({ priceIdYearly: v }),
                  onDisplay: (v: string) => patch({ displayPriceYearly: v }),
                },
              ] as const
            ).map((plan) => (
              <article key={plan.label} className="admin-stat-card">
                <p className="admin-stat-label">{plan.label}</p>
                <label className="admin-field-label">
                  Display price
                  <input
                    type="text"
                    value={plan.display}
                    disabled={!canEdit}
                    onChange={(e) => plan.onDisplay(e.target.value)}
                    className="field"
                  />
                </label>
                <label className="admin-field-label">
                  Stripe Price ID
                  <input
                    type="text"
                    value={plan.priceId}
                    disabled={!canEdit}
                    onChange={(e) => plan.onPriceId(e.target.value)}
                    className="field"
                    placeholder="price_…"
                  />
                </label>
              </article>
            ))}
          </div>

          {canEdit ? (
            <div className="admin-form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={busy || syncing || !canSync}
                onClick={() => void syncFromStripe()}
              >
                {syncing ? "Syncing…" : "Sync from Stripe"}
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={busy || syncing}
              >
                {busy ? "Saving…" : "Save Stripe settings"}
              </button>
              {msg ? <p className="admin-panel-sub">{msg}</p> : null}
            </div>
          ) : msg ? (
            <p className="admin-panel-sub">{msg}</p>
          ) : null}
        </form>

        {!stripeConfigured && (
          <section className="admin-panel">
            <p className="admin-panel-sub">
              Checkout is Live only when secret key, webhook secret, and at least
              one Price ID are set. Sync fills Price IDs; webhook secret still
              needs pasting from the Stripe Dashboard. User page:{" "}
              <Link href="/app/billing" className="admin-link">
                /app/billing
              </Link>
              .
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

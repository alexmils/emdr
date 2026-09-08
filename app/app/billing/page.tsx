"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  BILLING_PLANS,
  orderedBillingPlans,
  type BillingPlanId,
  type BillingPlanMeta,
} from "@/lib/billing-constants";
import { UpgradeModal } from "@/app/components/UpgradeModal";

type Status = {
  accessTier: string;
  canUseApp: boolean;
  needsOnboarding: boolean;
  needsPayment: boolean;
  plan: string;
  status: string;
  trialEndsAt: string | null;
  renewsAt: string | null;
  guidedUsed: number;
  guidedLimit: number;
  guidedRemaining: number;
  blsSecondsUsed: number;
  blsSecondsLimit: number;
  blsSecondsRemaining: number;
  isTrialLimited: boolean;
  stripeConfigured: boolean;
  plans?: Record<BillingPlanId, BillingPlanMeta>;
};

function BillingPageInner() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const checkout = params.get("checkout");
  const [status, setStatus] = useState<Status | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [plan, setPlan] = useState<BillingPlanId>("yearly");

  const refresh = useCallback(async () => {
    const qs = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : "";
    const res = await fetch(`/api/billing/status${qs}`);
    const data = await res.json();
    if (res.ok) setStatus(data as Status);
  }, [sessionId]);

  useEffect(() => {
    void refresh();
    if (checkout === "success") setMsg("Subscription updated.");
    if (checkout === "canceled") setMsg("Checkout canceled.");
  }, [refresh, checkout]);

  const checkoutStart = async () => {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, source: "billing_page" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error ?? "Checkout unavailable");
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      setMsg("Could not start checkout.");
    } finally {
      setBusy(false);
    }
  };

  const openPortal = async () => {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error ?? "Portal unavailable");
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      setMsg("Could not open billing portal.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)] px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:p-10">
      <div className="mx-auto max-w-lg">
        <Link
          href="/app"
          className="text-[13px] font-medium text-[var(--accent)] hover:underline"
        >
          ← Back to session
        </Link>
        <div className="admin-panel mt-5">
          <h1 className="admin-page-title">Your billing</h1>
          <p className="admin-panel-sub mt-2">
            Manage your plan, trial usage, and payment method.
          </p>

          {status && (
            <div className="settings-group mt-4">
              <div className="settings-row settings-kv">
                <span>Plan</span>
                <strong className="capitalize">{status.plan}</strong>
              </div>
              <div className="settings-row settings-kv">
                <span>Status</span>
                <strong className="capitalize">
                  {status.status.replace(/_/g, " ")}
                </strong>
              </div>
              {status.trialEndsAt && (
                <div className="settings-row settings-kv">
                  <span>Trial ends</span>
                  <strong>
                    {new Date(status.trialEndsAt).toLocaleDateString()}
                  </strong>
                </div>
              )}
              {status.renewsAt && (
                <div className="settings-row settings-kv">
                  <span>Renews</span>
                  <strong>
                    {new Date(status.renewsAt).toLocaleDateString()}
                  </strong>
                </div>
              )}
              {status.isTrialLimited && (
                <>
                  <div className="settings-row settings-kv">
                    <span>Guided sessions</span>
                    <strong>
                      {status.guidedUsed} / {status.guidedLimit}
                    </strong>
                  </div>
                  <div className="settings-row settings-kv">
                    <span>Free BLS</span>
                    <strong>
                      {Math.floor(status.blsSecondsUsed / 60)} /{" "}
                      {Math.floor(status.blsSecondsLimit / 60)} min
                    </strong>
                  </div>
                </>
              )}
            </div>
          )}

          {status?.needsPayment && (
            <>
              <div className="upgrade-plan-list mt-4">
                {orderedBillingPlans(status.plans ?? BILLING_PLANS).map((p) => {
                  const id = p.id;
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`upgrade-plan-card ${plan === id ? "upgrade-plan-card--selected" : ""}`}
                      onClick={() => setPlan(id)}
                      disabled={busy}
                    >
                      <span className="upgrade-plan-label">{p.label}</span>
                      <span className="upgrade-plan-price">
                        {p.displayPrice}
                        <span className="upgrade-plan-period">
                          {p.displayPeriod}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {(status?.needsPayment ||
            status?.isTrialLimited ||
            status?.accessTier === "active" ||
            status?.accessTier === "trialing" ||
            status?.status === "past_due" ||
            status?.needsOnboarding ||
            msg) && (
            <div className="billing-actions">
              {status?.needsPayment && (
                <button
                  type="button"
                  disabled={busy || !status.stripeConfigured}
                  onClick={() => void checkoutStart()}
                  className="btn-primary"
                >
                  {busy ? "Loading…" : "Subscribe"}
                </button>
              )}

              {status?.isTrialLimited && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setUpgradeOpen(true)}
                >
                  Upgrade for unlimited
                </button>
              )}

              {(status?.accessTier === "active" ||
                status?.accessTier === "trialing" ||
                status?.status === "past_due") && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void openPortal()}
                  className="btn-secondary"
                >
                  Manage billing
                </button>
              )}

              {status?.needsOnboarding && (
                <Link
                  href="/app/onboarding"
                  className="btn-secondary inline-flex"
                >
                  Continue onboarding
                </Link>
              )}

              {msg && <p className="admin-invite-msg">{msg}</p>}
            </div>
          )}
        </div>
      </div>

      <UpgradeModal
        open={upgradeOpen}
        reason="generic"
        guidedUsed={status?.guidedUsed}
        guidedLimit={status?.guidedLimit}
        blsSecondsUsed={status?.blsSecondsUsed}
        blsSecondsLimit={status?.blsSecondsLimit}
        onClose={() => setUpgradeOpen(false)}
      />
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense>
      <BillingPageInner />
    </Suspense>
  );
}

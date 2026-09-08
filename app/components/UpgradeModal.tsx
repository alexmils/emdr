"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BILLING_PLANS,
  orderedBillingPlans,
  type BillingPlanId,
  type BillingPlanMeta,
} from "@/lib/billing-constants";

type UpgradeReason = "trial_limit_reached" | "bls_limit_reached" | "generic";

type Props = {
  open: boolean;
  reason?: UpgradeReason;
  guidedUsed?: number;
  guidedLimit?: number;
  blsSecondsUsed?: number;
  blsSecondsLimit?: number;
  onClose: () => void;
};

export function UpgradeModal({
  open,
  reason = "generic",
  guidedUsed = 0,
  guidedLimit = 3,
  blsSecondsUsed = 0,
  blsSecondsLimit = 600,
  onClose,
}: Props) {
  const [plan, setPlan] = useState<BillingPlanId>("yearly");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [plans, setPlans] =
    useState<Record<BillingPlanId, BillingPlanMeta>>(BILLING_PLANS);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  useEffect(() => {
    if (!open) return;
    void (async () => {
      try {
        const res = await fetch("/api/billing/status");
        const data = (await res.json()) as {
          plans?: Record<BillingPlanId, BillingPlanMeta>;
        };
        if (res.ok && data.plans) setPlans(data.plans);
      } catch {
        /* keep defaults */
      }
    })();
  }, [open]);

  const headline =
    reason === "bls_limit_reached"
      ? "You’ve used your free BLS preview"
      : reason === "trial_limit_reached"
        ? "You’ve used your trial guided sessions"
        : "Upgrade for unlimited sessions";

  const detail =
    reason === "bls_limit_reached"
      ? `Trial includes ${Math.floor(blsSecondsLimit / 60)} minutes of free BLS (${blsSecondsUsed}s used). Upgrade for unlimited bilateral stimulation.`
      : reason === "trial_limit_reached"
        ? `Trial includes ${guidedLimit} guided wellness sessions (${guidedUsed} used). Upgrade to continue without limits.`
        : "Get unlimited guided wellness sessions and bilateral stimulation.";

  const upgrade = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const activateRes = await fetch("/api/billing/activate", { method: "POST" });
      const activateData = (await activateRes.json()) as {
        error?: string;
        code?: string;
      };
      if (activateRes.ok) {
        window.location.href = "/app/billing?activated=1";
        return;
      }

      if (
        activateData.code !== "needs_checkout" &&
        activateData.code !== "not_trialing"
      ) {
        // Unexpected activate failure — still try Checkout as fallback.
      }

      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, source: "upgrade_modal" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? activateData.error ?? "Checkout unavailable");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError("Checkout unavailable");
    } catch {
      setError("Could not start upgrade.");
    } finally {
      setBusy(false);
    }
  }, [plan]);

  if (!open) return null;

  return (
    <div
      className="admin-modal-backdrop"
      role="presentation"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <div
        className="admin-modal upgrade-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="upgrade-modal-title" className="admin-page-title">
          {headline}
        </h2>
        <p className="admin-panel-sub mt-2">{detail}</p>

        <div className="upgrade-plan-list mt-4" role="radiogroup" aria-label="Plan">
          {orderedBillingPlans(plans).map((p) => {
            const id = p.id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={plan === id}
                className={`upgrade-plan-card ${plan === id ? "upgrade-plan-card--selected" : ""} ${p.highlight ? "upgrade-plan-card--highlight" : ""}`}
                onClick={() => setPlan(id)}
                disabled={busy}
              >
                <span className="upgrade-plan-label">
                  {p.label}
                  {p.savingsHint ? (
                    <span className="upgrade-plan-badge">{p.savingsHint}</span>
                  ) : null}
                </span>
                <span className="upgrade-plan-price">
                  {p.displayPrice}
                  <span className="upgrade-plan-period">{p.displayPeriod}</span>
                </span>
              </button>
            );
          })}
        </div>

        <ul className="upgrade-benefits mt-4">
          <li>Unlimited guided wellness sessions</li>
          <li>Unlimited bilateral stimulation</li>
          <li>Cancel anytime from Billing</li>
        </ul>

        {error && <p className="admin-invite-msg mt-3">{error}</p>}

        <div className="admin-modal-actions mt-5">
          <button
            type="button"
            className="btn-secondary"
            disabled={busy}
            onClick={onClose}
          >
            Not now
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={busy}
            onClick={() => void upgrade()}
          >
            {busy ? "Loading…" : "Upgrade now"}
          </button>
        </div>
      </div>
    </div>
  );
}

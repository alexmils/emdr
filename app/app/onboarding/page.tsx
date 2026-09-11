"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthError, AuthSuccess } from "@/app/components/AuthShell";
import { HelpChatLink } from "@/app/components/HelpChatWidget";
import { OnboardingShell } from "@/app/components/onboarding/OnboardingShell";
import {
  BILLING_PLANS,
  orderedBillingPlans,
  TRIAL_BLS_SECONDS,
  TRIAL_DAYS,
  TRIAL_GUIDED_SESSIONS,
  type BillingPlanId,
  type BillingPlanMeta,
} from "@/lib/billing-constants";
import { APP_BASE } from "@/lib/app-base";

type BillingStatus = {
  accessTier: string;
  canUseApp: boolean;
  needsOnboarding: boolean;
  needsPayment: boolean;
  plan: string;
  status: string;
  guidedRemaining: number;
  blsSecondsRemaining: number;
  isTrialLimited: boolean;
  stripeConfigured: boolean;
  onboardingCompletedAt: string | null;
  plans?: Record<BillingPlanId, BillingPlanMeta>;
};

type Step = "plan" | "tutorial";

const FREE_MINUTES = Math.floor(TRIAL_BLS_SECONDS / 60);

function OnboardingFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const checkout = params.get("checkout");
  const sessionId = params.get("session_id");
  const canceledPlan = params.get("plan");

  const [step, setStep] = useState<Step>("plan");
  const [plan, setPlan] = useState<BillingPlanId>(
    canceledPlan === "weekly" || canceledPlan === "monthly" ? canceledPlan : "yearly"
  );
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const refreshStatus = useCallback(async () => {
    const qs = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : "";
    const res = await fetch(`/api/billing/status${qs}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error ?? "Could not load billing status");
    }
    setStatus(data as BillingStatus);
    return data as BillingStatus;
  }, [sessionId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let data = await refreshStatus();
        if (cancelled) return;

        // Stripe webhook / session verify can lag briefly after redirect.
        if (checkout === "success" && !data.canUseApp) {
          for (let i = 0; i < 4 && !cancelled && !data.canUseApp; i++) {
            await new Promise((r) => setTimeout(r, 1200));
            data = await refreshStatus();
          }
        }
        if (cancelled) return;

        if (sessionId && typeof window !== "undefined") {
          const url = new URL(window.location.href);
          if (url.searchParams.has("session_id")) {
            url.searchParams.delete("session_id");
            window.history.replaceState({}, "", url.pathname + url.search);
          }
        }

        if (checkout === "success" && !data.canUseApp) {
          setStep("plan");
          setError(
            "Payment is still confirming. Wait a moment, then refresh — or pick a plan if checkout did not finish."
          );
        } else if (data.canUseApp) {
          if (data.onboardingCompletedAt && checkout !== "success") {
            router.replace(APP_BASE);
            return;
          }
          setStep("tutorial");
          if (checkout === "success") {
            setSuccess("Payment method saved. Your trial is ready.");
          }
        } else if (checkout === "canceled") {
          setStep("plan");
          setError("Checkout canceled. Choose a plan when you’re ready.");
        } else if (!data.needsOnboarding && data.needsPayment) {
          // Returning canceled / blocked users — billing, not a fresh trial pitch.
          router.replace(`${APP_BASE}/billing`);
          return;
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Load failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [checkout, refreshStatus, router, sessionId]);

  const startCheckout = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, source: "onboarding" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Checkout unavailable");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError("Checkout unavailable");
    } catch {
      setError("Could not start checkout.");
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding/complete", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not finish onboarding");
        if (data.code === "needs_payment") setStep("plan");
        return;
      }
      router.replace(APP_BASE);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const shellCopy = useMemo(() => {
    if (step === "plan") {
      return {
        kicker: "Getting started" as string | undefined,
        title: "Pick a plan",
        lead: `${TRIAL_DAYS} days free · cancel anytime`,
      };
    }
    return {
      kicker: undefined as string | undefined,
      title: "You’re ready",
      lead: "Your trial is on. Open the app and tap New chat.",
    };
  }, [step]);

  if (loading) {
    return (
      <OnboardingShell
        kicker="Getting started"
        title="Setting up…"
        lead="Loading your account"
      >
        <p className="ob-note" style={{ margin: 0 }}>
          Please wait…
        </p>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell
      kicker={shellCopy.kicker}
      title={shellCopy.title}
      lead={shellCopy.lead}
      footer={
        <p>
          <HelpChatLink>Need help?</HelpChatLink>
        </p>
      }
    >
      {error && <AuthError message={error} />}
      {step === "plan" && success ? <AuthSuccess message={success} /> : null}

      {step === "plan" && (
        <div>
          {!status?.stripeConfigured && (
            <AuthError message="Stripe is not configured yet. Ask your admin to set price IDs." />
          )}
          <div className="upgrade-plan-list" role="radiogroup" aria-label="Plan">
            {orderedBillingPlans(status?.plans ?? BILLING_PLANS).map((p) => {
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
          <p className="ob-note">
            Trial includes {TRIAL_GUIDED_SESSIONS} guided sessions and{" "}
            {FREE_MINUTES} min of Free session time. We save your card now —
            billing starts after day {TRIAL_DAYS}.
          </p>
          <button
            type="button"
            className="frontend-btn-primary ob-cta"
            disabled={busy || !status?.stripeConfigured}
            onClick={() => void startCheckout()}
          >
            {busy ? "Redirecting…" : `Start ${TRIAL_DAYS}-day trial`}
          </button>
        </div>
      )}

      {step === "tutorial" && (
        <div className="ob-tutorial">
          <div className="ob-ball-preview" aria-hidden="true">
            <div className="ob-ball-track">
              <span className="ob-ball-dot" />
            </div>
          </div>
          <button
            type="button"
            className="frontend-btn-primary ob-cta"
            disabled={busy}
            onClick={() => void finish()}
          >
            {busy ? "Opening…" : "Open the app"}
          </button>
        </div>
      )}
    </OnboardingShell>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingFlow />
    </Suspense>
  );
}

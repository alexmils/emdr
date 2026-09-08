"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AuthShell,
  AuthError,
  AuthSuccess,
} from "@/app/components/AuthShell";
import { HelpChatLink } from "@/app/components/HelpChatWidget";
import {
  BILLING_PLANS,
  TRIAL_BLS_SECONDS,
  TRIAL_DAYS,
  TRIAL_GUIDED_SESSIONS,
  type BillingPlanId,
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
};

type Step = "welcome" | "plan" | "tutorial";

function OnboardingFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const checkout = params.get("checkout");
  const sessionId = params.get("session_id");
  const canceledPlan = params.get("plan");

  const [step, setStep] = useState<Step>("welcome");
  const [plan, setPlan] = useState<BillingPlanId>(
    canceledPlan === "monthly" ? "monthly" : "yearly"
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
          setStep("plan");
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
  }, [checkout, refreshStatus, router]);

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

  const subtitle = useMemo(() => {
    if (step === "welcome") return "Guided wellness sessions with BLS";
    if (step === "plan")
      return `${TRIAL_DAYS}-day trial · card required · cancel anytime`;
    return "A few tips before your first session";
  }, [step]);

  if (loading) {
    return (
      <AuthShell title="Setting up…" subtitle="Loading your account" hideHomeLink>
        <p className="onboarding-note !mb-0 text-center">Please wait…</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={
        step === "welcome"
          ? "Welcome"
          : step === "plan"
            ? "Choose a plan"
            : "Quick start"
      }
      subtitle={subtitle}
      hideHomeLink
      footer={
        <p>
          <HelpChatLink>Need help?</HelpChatLink>
        </p>
      }
    >
      {error && <AuthError message={error} />}
      {success && <AuthSuccess message={success} />}

      {step === "welcome" && (
        <div>
          <ul className="onboarding-bullets">
            <li>AI-guided sessions or free BLS mode</li>
            <li>
              {TRIAL_DAYS}-day trial: {TRIAL_GUIDED_SESSIONS} guided sessions and{" "}
              {Math.floor(TRIAL_BLS_SECONDS / 60)} min free BLS
            </li>
            <li>Card required — you won’t be charged until the trial ends</li>
          </ul>
          <button
            type="button"
            className="btn-primary mt-4 w-full"
            onClick={() => setStep("plan")}
          >
            Continue
          </button>
        </div>
      )}

      {step === "plan" && (
        <div>
          {!status?.stripeConfigured && (
            <AuthError message="Stripe is not configured yet. Ask your admin to set price IDs." />
          )}
          <div className="upgrade-plan-list" role="radiogroup" aria-label="Plan">
            {(Object.keys(BILLING_PLANS) as BillingPlanId[]).map((id) => {
              const p = BILLING_PLANS[id];
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
          <p className="onboarding-note mt-3">
            Payment method is saved now. Billing starts after the {TRIAL_DAYS}-day
            trial.
          </p>
          <button
            type="button"
            className="btn-primary w-full"
            disabled={busy || !status?.stripeConfigured}
            onClick={() => void startCheckout()}
          >
            {busy ? "Redirecting…" : "Start trial"}
          </button>
          <button
            type="button"
            className="btn-ghost mt-2 w-full"
            disabled={busy}
            onClick={() => setStep("welcome")}
          >
            Back
          </button>
        </div>
      )}

      {step === "tutorial" && (
        <div>
          <ol className="onboarding-steps">
            <li>
              <strong>New chat</strong> — start a session from the sidebar
            </li>
            <li>
              <strong>Guided or Free</strong> — pick how you want to work
            </li>
            <li>
              <strong>BLS bar</strong> — start, stop, and adjust the ball
            </li>
          </ol>
          {status?.isTrialLimited && (
            <p className="onboarding-note">
              Trial left: {status.guidedRemaining} guided ·{" "}
              {Math.floor(Math.max(0, status.blsSecondsRemaining) / 60)} min BLS
            </p>
          )}
          <button
            type="button"
            className="btn-primary mt-4 w-full"
            disabled={busy}
            onClick={() => void finish()}
          >
            {busy ? "Opening…" : "Go to app"}
          </button>
        </div>
      )}
    </AuthShell>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingFlow />
    </Suspense>
  );
}

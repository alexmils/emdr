import Link from "next/link";
import { appPath, LOGIN_PATH } from "@/lib/app-base";
import {
  BILLING_PLANS,
  TRIAL_DAYS,
  orderedBillingPlans,
} from "@/lib/billing-constants";
import { BRAND_SPOKEN } from "@/lib/brand";
import "./pricing-page.css";

export function PricingPageView() {
  const plans = orderedBillingPlans(BILLING_PLANS);

  return (
    <article className="frontend-legal frontend-legal--long">
      <h1>Pricing — EMDR app plans and free trial</h1>
      <p>
        Start with a {TRIAL_DAYS}-day trial. Every paid plan unlocks the same
        agent-guided sessions and Free sets — pick how often you want to be
        billed.
      </p>

      <h2>Plans</h2>
      <ul className="frontend-pricing-plans">
        {plans.map((plan) => (
          <li
            key={plan.id}
            className={`frontend-pricing-plan${plan.highlight ? " frontend-pricing-plan--highlight" : ""}`}
          >
            <div className="frontend-pricing-plan-copy">
              <span className="frontend-pricing-plan-label">{plan.label}</span>
              {plan.savingsHint ? (
                <span className="frontend-pricing-plan-hint">
                  {plan.savingsHint}
                </span>
              ) : null}
            </div>
            <p className="frontend-pricing-plan-price">
              <span className="frontend-pricing-plan-amount">
                {plan.displayPrice}
              </span>
              <span className="frontend-pricing-plan-period">
                {plan.displayPeriod}
              </span>
            </p>
          </li>
        ))}
      </ul>

      <h2>What every plan includes</h2>
      <p>
        Agent-guided EMDR sessions with optional voice, Free visual sets you run
        yourself, and the same session controls for speed, animation, sound, and
        repeats. Billing interval is the only difference between plans.
      </p>

      <h2>Trial and cancel</h2>
      <p>
        The {TRIAL_DAYS}-day trial lets you try the full product before you pay.
        Cancel anytime from account billing — you keep access until the period
        you already paid for ends.
      </p>

      <h2>Before you start</h2>
      <p>
        Common questions are on <Link href="/faq">FAQ</Link>. Product limits are
        on <Link href="/limits">Limits</Link>. How a session runs is on{" "}
        <Link href="/emdr">AI-guided EMDR</Link>.
      </p>

      <div className="frontend-hero-actions">
        <Link href={appPath("/create-account")} className="frontend-btn-primary">
          Get started
        </Link>
        <Link href={LOGIN_PATH} className="frontend-btn-ghost">
          Sign in
        </Link>
      </div>

      <p className="frontend-legal-note">
        {BRAND_SPOKEN} is self-help software for practice between sessions.{" "}
        <Link href="/limits">Read the limits</Link>.
      </p>
    </article>
  );
}

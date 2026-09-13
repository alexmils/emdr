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
      <h1>Plans for AI-guided EMDR</h1>
      <p>
        Start with a {TRIAL_DAYS}-day trial. Every paid plan unlocks the same
        agent-guided sessions and Free sets — pick how often you want to be
        billed.
      </p>

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

      <div className="frontend-hero-actions">
        <Link href={appPath("/create-account")} className="frontend-btn-primary">
          Get started
        </Link>
        <Link href={LOGIN_PATH} className="frontend-btn-ghost">
          Sign in
        </Link>
      </div>

      <p className="frontend-legal-note">
        See <Link href="/limits">what {BRAND_SPOKEN} does not do</Link> and{" "}
        <Link href="/faq">common questions</Link> before you start.
      </p>
    </article>
  );
}

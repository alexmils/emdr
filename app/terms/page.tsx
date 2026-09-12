import { FrontendBreadcrumbs } from "@/app/components/frontend/FrontendBreadcrumbs";
import { FrontendShell } from "@/app/components/frontend/FrontendShell";
import {
  BRAND_DOMAIN,
  BRAND_PRODUCT,
  BRAND_SPOKEN,
} from "@/lib/brand";
import {
  formatLegalEntityBlock,
  LEGAL_DOC_VERSION,
  LEGAL_ENTITY,
  legalEntityDisplayName,
  pendingCounselNotice,
} from "@/lib/legal-entity";
import { buildCachedPageMetadata } from "@/lib/site-seo-cache";
import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return buildCachedPageMetadata("terms");
}

export default function TermsPage() {
  const operator = legalEntityDisplayName();
  const law =
    LEGAL_ENTITY.governingLaw?.trim() ||
    "the courts of the operator’s place of establishment (to be confirmed)";
  const forum =
    LEGAL_ENTITY.jurisdiction?.trim() ||
    "the competent courts of that place (to be confirmed)";

  return (
    <FrontendShell>
      <article className="frontend-legal frontend-legal--long">
        <FrontendBreadcrumbs
          items={[
            { href: "/", label: "Home" },
            { label: "Terms" },
          ]}
        />
        <p className="frontend-legal-draft-banner" role="note">
          {pendingCounselNotice()}
        </p>
        <h1>Terms of service</h1>
        <p className="frontend-legal-meta">
          Version {LEGAL_DOC_VERSION.terms} · Last updated 12 September 2026
        </p>

        <h2>1. Agreement to terms</h2>
        <p>
          These Terms of Service are a legally binding agreement between you and{" "}
          {operator} (“Company,” “we,” “us,” or “our”) concerning your access to
          and use of the {BRAND_SPOKEN} website and web application at{" "}
          {BRAND_DOMAIN}, including {BRAND_PRODUCT} sessions (the “Service”).
        </p>
        <p>
          By creating an account, starting a session, or otherwise using the
          Service, you agree to these terms. If you do not agree, do not use the
          Service.
        </p>
        <pre className="frontend-legal-pre">{formatLegalEntityBlock()}</pre>

        <h2>2. Not therapy, not a medical device</h2>
        <p>
          {BRAND_SPOKEN} is self-help software operated by {operator}. It is not
          a licensed therapist, psychiatrist, psychologist, or other clinician.
          It does not diagnose, treat, or cure disease. It is not a medical
          device and is not emergency care. Do not use it as a substitute for
          professional clinical judgment or in-person care.
        </p>

        <h2>3. Assumption of risk</h2>
        <p>
          Working with difficult memories can bring up intense emotions,
          flooding, or intrusive material. You choose to use the product at your
          own risk. You are responsible for deciding whether self-guided or
          agent-guided sets are appropriate for you, and for stopping if you
          feel unsafe.
        </p>

        <h2>4. No emergency duty</h2>
        <p>
          {BRAND_SPOKEN} does not monitor you in real time and has no duty to
          provide crisis intervention. If you might hurt yourself or someone
          else, contact emergency services or a crisis line immediately — in the
          US, call or text <strong>988</strong>. See{" "}
          <Link href="/resources">Resources</Link> for additional links.
        </p>

        <h2>5. Eligibility (18+)</h2>
        <p>
          You must be at least 18 years old to create an account or use
          sessions. We do not knowingly provide the Service to minors.
        </p>

        <h2>6. User representations</h2>
        <p>By using the Service, you represent and warrant that:</p>
        <ul>
          <li>You have the legal capacity to enter into these terms</li>
          <li>You will not use the Service for any illegal or unauthorized purpose</li>
          <li>
            Your use of the Service will not violate any applicable law or
            regulation
          </li>
        </ul>

        <h2>7. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>
            Use {BRAND_SPOKEN} for clinical diagnosis or as a medical device
          </li>
          <li>
            Share your account or attempt to bypass safety or billing limits
          </li>
          <li>
            Probe, scrape, or abuse the Service, or reverse-engineer the app
            beyond what law allows
          </li>
          <li>
            Upload unlawful content or attempt to jailbreak safety systems
          </li>
          <li>
            Harass, threaten, or interfere with other users or our systems
          </li>
        </ul>

        <h2>8. Accounts and suspension</h2>
        <p>
          You must provide accurate registration details and keep credentials
          secure. We may suspend or terminate accounts for breach of these
          terms, abuse, unpaid charges, or safety concerns. You may stop using
          the Service at any time; some data retention rules are described in
          the <Link href="/privacy">Privacy Policy</Link>.
        </p>

        <h2>9. Subscriptions, billing, and cancellation</h2>
        <p>
          {BRAND_SPOKEN} is a SaaS product. Paid plans are billed through Stripe.
          Prices and plan lengths are shown at checkout and in the app. Trials
          convert to paid billing unless you cancel before the trial ends via
          the billing portal or applicable Stripe Customer Portal flow.
        </p>
        <p>
          If you are a consumer in the EU/EEA/UK, you may have a 14-day right to
          withdraw from a distance contract. Where digital content begins with
          your prior express consent and acknowledgment that you lose the
          withdrawal right once performance starts, that right may not apply —
          we will present any required consent at checkout when applicable.
          Chargebacks and refund requests are handled case-by-case; contact
          support with your account email.
        </p>

        <h2>10. Intellectual property</h2>
        <p>
          The Service — including the {BRAND_SPOKEN} name and wave lockup,
          product UI, and software — is owned by {operator} or its licensors.
          You receive a limited, non-exclusive, non-transferable license to use
          the Service for personal, non-commercial self-help. Session content
          you create remains yours, subject to the license you grant us to host
          and process it to provide the Service (see Privacy).
        </p>

        <h2>11. AI features</h2>
        <p>
          Agent-guided sessions and help chat use automated systems. Outputs can
          be incomplete or wrong. The agent is not a human clinician and must
          not be treated as one.
        </p>

        <h2>12. Third-party services</h2>
        <p>
          The Service may rely on third parties (for example Stripe, hosting,
          email, and model providers). We are not responsible for third-party
          sites or services we do not control. Your use of those services may be
          subject to their own terms.
        </p>

        <h2>13. Disclaimers</h2>
        <p>
          THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE.” TO THE FULLEST
          EXTENT PERMITTED BY LAW, {operator.toUpperCase()} DISCLAIMS WARRANTIES
          OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
          NON-INFRINGEMENT.
        </p>

        <h2>14. Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, {operator}’s total liability
          arising out of these terms or the Service is limited to the greater of
          (a) the amounts you paid to us for the Service in the 12 months before
          the claim, or (b) USD $50. We are not liable for indirect, incidental,
          special, consequential, or punitive damages, or for emotional distress,
          lost data, or lost profits, even if advised of the possibility —
          except where liability cannot be limited (including death or personal
          injury caused by negligence where such limitation is unlawful).
        </p>

        <h2>15. Indemnification</h2>
        <p>
          You agree to defend, indemnify, and hold harmless {operator} and its
          officers, directors, employees, and agents from claims arising out of
          your use of the Service or your breach of these terms, to the extent
          permitted by law.
        </p>

        <h2>16. Governing law and disputes</h2>
        <p>
          These terms are governed by the laws of {law}, without regard to
          conflict-of-law rules that would apply another jurisdiction’s law.
          Exclusive venue for disputes is {forum}, except that consumers may
          retain mandatory rights to bring claims in their home courts where
          required by law.
        </p>

        <h2>17. Changes</h2>
        <p>
          We may update these terms. Material changes will be posted on this
          page with a new version id. Continued use after the effective date
          constitutes acceptance where permitted by law. Session consent may ask
          you to re-confirm when the informed-consent version changes.
        </p>

        <h2>18. Contact</h2>
        <p>
          Questions about these terms: use in-app Help or email{" "}
          <a href={`mailto:hi@contact.${BRAND_DOMAIN}`}>
            hi@contact.{BRAND_DOMAIN}
          </a>
          .
        </p>
      </article>
    </FrontendShell>
  );
}

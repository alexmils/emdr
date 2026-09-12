import { FrontendBreadcrumbs } from "@/app/components/frontend/FrontendBreadcrumbs";
import { FrontendShell } from "@/app/components/frontend/FrontendShell";
import {
  BRAND_DOMAIN,
  BRAND_PRODUCT,
  BRAND_SPOKEN,
} from "@/lib/brand";
import {
  DATA_HOSTING_REGION,
  formatLegalEntityBlock,
  LEGAL_DOC_VERSION,
  legalEntityDisplayName,
  pendingCounselNotice,
} from "@/lib/legal-entity";
import { getPlatformSettings } from "@/lib/platform-settings";
import { buildCachedPageMetadata } from "@/lib/site-seo-cache";
import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return buildCachedPageMetadata("privacy");
}

export default async function PrivacyPage() {
  let supportEmail = `hi@contact.${BRAND_DOMAIN}`;
  try {
    const settings = await getPlatformSettings();
    supportEmail = settings.supportEmail || supportEmail;
  } catch {
    // Build-time / DB unavailable
  }

  return (
    <FrontendShell>
      <article className="frontend-legal frontend-legal--long">
        <FrontendBreadcrumbs
          items={[
            { href: "/", label: "Home" },
            { label: "Privacy" },
          ]}
        />
        <p className="frontend-legal-draft-banner" role="note">
          {pendingCounselNotice()}
        </p>
        <h1>Privacy policy</h1>
        <p className="frontend-legal-meta">
          Version {LEGAL_DOC_VERSION.privacy} · Last updated 12 September 2026
        </p>

        <h2>1. Controller</h2>
        <p>
          This policy describes how {legalEntityDisplayName()} (“we,” “us”),
          operating the {BRAND_SPOKEN} product, processes personal data when you
          use {BRAND_DOMAIN} and {BRAND_PRODUCT}.
        </p>
        <pre className="frontend-legal-pre">{formatLegalEntityBlock()}</pre>
        <p>
          Contact for privacy requests:{" "}
          <a href={`mailto:${supportEmail}`}>{supportEmail}</a>. A Data
          Protection Officer will be named here if/when one is appointed.
        </p>

        <h2>2. Special category data (GDPR Art. 9)</h2>
        <p>
          Session transcripts, intake answers, risk notes, SUD/VoC ratings, and
          related mental-health content are special category data. We process
          that data only with your <strong>explicit consent</strong> under
          GDPR Article 9(2)(a) (and equivalent UK GDPR where applicable),
          collected before your first processing session and recorded with a
          timestamp and document version. You may withdraw consent by deleting
          your account or contacting us; withdrawal does not affect prior lawful
          processing.
        </p>

        <h2>3. What we collect</h2>
        <ul>
          <li>Account data: email, name, password hash or OAuth identifiers</li>
          <li>
            Session data: messages, protocol phase, targets, SUD/VoC, intake /
            client profile fields, risk flags and notes
          </li>
          <li>Usage and billing metadata (Stripe customer / subscription ids)</li>
          <li>
            Technical logs: IP (when trusted proxy is configured), user agent,
            consent records, audit events
          </li>
          <li>
            Marketing analytics cookies only after consent (see cookie banner)
          </li>
        </ul>

        <h2 id="cookies">Cookies</h2>
        <p>
          On public marketing pages we use necessary cookies to remember your
          cookie choice. Analytics and marketing cookies (for example Google
          Analytics 4, Google Tag Manager, Microsoft Clarity) run only after you
          allow them in the cookie banner. You can change that choice anytime
          via Cookie settings in the site footer. Session cookies for signing in
          to the app are required for the product to work.
        </p>

        <h2>4. Where data is stored</h2>
        <p>{DATA_HOSTING_REGION}</p>

        <h2>5. Subprocessors</h2>
        <p>We use providers to run the product, including:</p>
        <ul>
          <li>Hosting / containers (Coolify on our VPS)</li>
          <li>Cloudflare (DNS, CDN, Turnstile bot protection)</li>
          <li>Stripe (payments)</li>
          <li>Email delivery (Brevo; optional Gmail API fallback)</li>
          <li>LLM / voice providers configured for agent-guided sessions</li>
          <li>
            Optional marketing tags after cookie consent: Google Analytics 4,
            Google Tag Manager, Microsoft Clarity
          </li>
        </ul>
        <p>
          We aim to keep Data Processing Agreements (DPAs) with each
          subprocessor. Status is tracked internally for launch readiness.
        </p>

        <h2>6. Large language models</h2>
        <p>
          When you use agent-guided chat or related AI features, relevant
          prompts and session context are sent to the configured model provider
          so the product can respond. Our product intent is that{" "}
          <strong>customer content is not used to train</strong> foundation
          models. Where a provider offers zero-retention or “no training”
          contractual options, we prefer those settings. Confirm current
          provider terms with support; do not assume every vendor default
          matches this intent until a DPA is on file.
        </p>

        <h2>7. Legal bases (summary)</h2>
        <ul>
          <li>Contract — account, sessions, billing</li>
          <li>Consent — special category session content; non-essential cookies</li>
          <li>Legitimate interests — security, fraud prevention, product integrity</li>
          <li>Legal obligation — tax / accounting where required</li>
        </ul>

        <h2>8. Retention</h2>
        <p>
          Account and session data are kept while your account is active.
          Deleted accounts are removed or anonymized from primary stores within a
          reasonable period (target: 30 days), except backups and records we must
          keep for legal, billing, or dispute reasons. Consent and key audit
          events may be retained longer as proof of compliance.
        </p>

        <h2 id="update-or-delete">9. Update or delete your account</h2>
        <p>
          You can update or delete your account yourself in the app:
        </p>
        <ul>
          <li>
            <strong>Update profile</strong> — Sign in →{" "}
            <Link href="/app/settings?tab=profile">Settings → Profile</Link>.
            Change your display name or photo, then Save profile.
          </li>
          <li>
            <strong>Delete account</strong> — Sign in → Settings → Profile →
            Danger zone → Delete account. Type your account email to confirm.
            This permanently removes your account, sessions, intake notes, and
            memory sets. If a Stripe subscription is on file, it must cancel
            successfully before deletion finishes.
          </li>
        </ul>
        <p>
          Prefer email help instead? Contact{" "}
          <a href={`mailto:${supportEmail}`}>{supportEmail}</a> from the address
          on your account. We may ask you to verify ownership before erasure.
        </p>

        <h2>10. Your rights</h2>
        <p>
          Subject to applicable law (including GDPR), you may request access,
          correction, erasure (Art. 17), restriction, objection, and
          portability (Art. 20). Start with the in-app delete flow above, or
          contact {supportEmail}. You may also lodge a complaint with your local
          supervisory authority.
        </p>

        <h2>11. International transfers</h2>
        <p>
          Some subprocessors may process data outside the EEA/UK. Where required,
          we rely on appropriate safeguards such as Standard Contractual Clauses
          (SCCs) or equivalent mechanisms.
        </p>

        <h2>12. Security and breaches</h2>
        <p>
          We use access controls, encrypted transport (TLS), and database
          row-level security for user data tables where implemented. No method is
          perfectly secure. If a personal-data breach poses risk, we will notify
          the competent authority within 72 hours where GDPR requires it, and
          affected users when required.
        </p>

        <h2>13. Children</h2>
        <p>
          The service is for adults 18+. We do not knowingly collect special
          category data from children.
        </p>

        <h2>14. Related documents</h2>
        <p>
          See also <Link href="/terms">Terms of service</Link>. Product safety
          positioning remains wellness / self-help — not a medical device.
        </p>

        <h2>15. Changes</h2>
        <p>
          We may update this policy and bump {LEGAL_DOC_VERSION.privacy}. Material
          changes will be posted here; re-consent may be required for session use
          when the informed-consent version changes.
        </p>
      </article>
    </FrontendShell>
  );
}

import { FrontendShell } from "@/app/components/frontend/FrontendShell";
import { BRAND_SPOKEN } from "@/lib/brand";
import {
  CLINICAL_ADVISOR,
  hasClinicalAdvisorConfigured,
} from "@/lib/legal-entity";
import { buildCachedPageMetadata } from "@/lib/site-seo-cache";
import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return buildCachedPageMetadata("clinical-team");
}

export default function ClinicalTeamPage() {
  const configured = hasClinicalAdvisorConfigured();

  return (
    <FrontendShell>
      <article className="frontend-legal">
        <h1>Clinical review</h1>
        <p>
          {BRAND_SPOKEN} is self-help software. Clinical review of intake
          screening, safety copy, and protocol barriers is part of how we keep
          the product honest — not a claim that the app is therapy or a medical
          device.
        </p>
        {configured ? (
          <>
            <h2>Named advisor</h2>
            <p>
              <strong>{CLINICAL_ADVISOR.name}</strong>
              {CLINICAL_ADVISOR.credentials
                ? ` — ${CLINICAL_ADVISOR.credentials}`
                : null}
            </p>
            {CLINICAL_ADVISOR.lastReviewedAt ? (
              <p>
                Last review of intake and safety materials:{" "}
                {CLINICAL_ADVISOR.lastReviewedAt}
              </p>
            ) : null}
          </>
        ) : (
          <>
            <h2>Status</h2>
            <p>
              Clinical review is in progress. A named EMDR-certified advisor will
              be listed here once they have agreed to be named and have reviewed
              the intake / safety materials. We do not invent credentials.
            </p>
          </>
        )}
        <p>
          Public guides remain product-team explainers — see{" "}
          <Link href="/editorial">How we write</Link>. Related:{" "}
          <Link href="/about">About</Link>, <Link href="/terms">Terms</Link>.
        </p>
      </article>
    </FrontendShell>
  );
}

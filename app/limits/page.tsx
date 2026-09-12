import { FrontendShell } from "@/app/components/frontend/FrontendShell";
import { JsonLd } from "@/app/components/frontend/JsonLd";
import { BRAND_SPOKEN } from "@/lib/brand";
import { getPublicAppUrl } from "@/lib/platform-settings";
import { buildLimitsJsonLd } from "@/lib/seo-jsonld";
import { buildCachedPageMetadata } from "@/lib/site-seo-cache";
import { siteOrigin } from "@/lib/site-seo";
import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 3600; // PUBLIC_PAGE_REVALIDATE_SECONDS

export async function generateMetadata(): Promise<Metadata> {
  return buildCachedPageMetadata("limits");
}

export default async function LimitsPage() {
  let publicUrl: string | undefined;
  try {
    publicUrl = await getPublicAppUrl();
  } catch {
    publicUrl = undefined;
  }
  const origin = siteOrigin(publicUrl);

  return (
    <FrontendShell>
      <JsonLd data={buildLimitsJsonLd(origin)} />
      <article className="frontend-legal frontend-legal--long">
        <h1>What {BRAND_SPOKEN} does not do</h1>
        <p>
          Most tools list what they can do. This page is the other half — an
          honest account of where {BRAND_SPOKEN} stops. If a claim is not on this
          page, we are not making it.
        </p>
        <p>
          {BRAND_SPOKEN} is self-help software for bilateral stimulation. It is
          not therapy, not a medical device, and not a clinician. That boundary
          is not a disclaimer we hide at the bottom — it is the design.
        </p>

        <h2>It does not diagnose</h2>
        <p>
          {BRAND_SPOKEN} does not assess, label, or diagnose any condition. It
          will not tell you whether you have PTSD, anxiety, or a trauma disorder,
          and it will not screen you into or out of one. Only a qualified
          clinician can do that.
        </p>

        <h2>It does not treat or cure anything</h2>
        <p>
          {BRAND_SPOKEN} does not treat, cure, or manage any illness. Bilateral
          stimulation is a technique you can practise; running it in a structured
          session is not the same as receiving treatment for a condition. If you
          need treatment, you need a clinician.
        </p>

        <h2>It does not make clinical judgments</h2>
        <p>
          The AI runs the session structure — it keeps time, prompts grounding,
          tracks your ratings, and closes the session. It does not decide whether
          you are ready to process a memory, whether a reaction has crossed from
          uncomfortable into unsafe, or what to do when something unexpected
          surfaces. Those are clinical judgments, and a tool cannot make them.
        </p>

        <h2>It does not hold a therapeutic relationship</h2>
        <p>
          There is no therapist on the other side. The AI does not know you,
          remember you as a person across sessions, or form a treatment alliance.
          It is a guide for a technique, not a relationship.
        </p>

        <h2>It does not provide crisis or emergency care</h2>
        <p>
          {BRAND_SPOKEN} cannot respond to an emergency. If you are in crisis,
          having thoughts of harming yourself, or unable to stay safe, contact
          help now — in the US, call or text <a href="tel:988">988</a>, or call
          your local emergency number. The full guide is on{" "}
          <Link href="/safety">Safety</Link>.
        </p>

        <h2>It is not for everyone</h2>
        <p>
          {BRAND_SPOKEN} is not appropriate if you are under 18, in an active
          crisis, or if you have a dissociative disorder, complex or
          developmental trauma, or psychosis. Self-directed work is not safe for
          those situations — please work with a clinician. See{" "}
          <Link href="/safety">Safety</Link> for the full list and what to do
          instead.
        </p>

        <h2>It does not replace a therapist</h2>
        <p>
          The most useful thing {BRAND_SPOKEN} does is give structure to practice
          between sessions — grounding, containment, and sets you run yourself.
          That is real value, and it is also the whole of it. For the assessment,
          the clinical judgment, and the hard parts of processing trauma, you
          need a person.{" "}
          <Link href="/emdr">How a Nura session works</Link> explains exactly
          where the line sits.
        </p>

        <p className="frontend-legal-note">
          {BRAND_SPOKEN} is self-help software operated by Receptly LLC. It is
          not a licensed therapist, not a medical device, and it does not
          diagnose or treat any condition. Read the{" "}
          <Link href="/terms">Terms</Link> and{" "}
          <Link href="/privacy">Privacy policy</Link>.
        </p>
      </article>
    </FrontendShell>
  );
}

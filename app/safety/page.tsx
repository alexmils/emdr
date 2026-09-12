import { FrontendShell } from "@/app/components/frontend/FrontendShell";
import { JsonLd } from "@/app/components/frontend/JsonLd";
import { BRAND_SPOKEN } from "@/lib/brand";
import { getPublicAppUrl } from "@/lib/platform-settings";
import { buildSafetyJsonLd } from "@/lib/seo-jsonld";
import { buildCachedPageMetadata } from "@/lib/site-seo-cache";
import { siteOrigin } from "@/lib/site-seo";
import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 3600; // PUBLIC_PAGE_REVALIDATE_SECONDS

export async function generateMetadata(): Promise<Metadata> {
  return buildCachedPageMetadata("safety");
}

export default async function SafetyPage() {
  let publicUrl: string | undefined;
  try {
    publicUrl = await getPublicAppUrl();
  } catch {
    publicUrl = undefined;
  }
  const origin = siteOrigin(publicUrl);

  return (
    <FrontendShell>
      <JsonLd data={buildSafetyJsonLd(origin)} />
      <article className="frontend-legal frontend-legal--long">
        <h1>Using AI-guided EMDR safely</h1>
        <p>
          {BRAND_SPOKEN} is a self-help tool for bilateral stimulation. It gives
          structure to practice you do on your own — it is not therapy, not a
          diagnosis, and not emergency care. Bilateral stimulation can stir
          things up. This page is about noticing when to stop, when to bring in a
          clinician, and where to turn if you are not safe.
        </p>

        <p className="frontend-legal-note">
          <strong>If you are in danger right now, do not use the app.</strong> In
          the US, call or text <a href="tel:988">988</a> (Suicide &amp; Crisis
          Lifeline). Anywhere, call your local emergency number (often 112 or
          911). {BRAND_SPOKEN} cannot respond to a crisis.
        </p>

        <h2>Stop the session and move to grounding if</h2>
        <ul>
          <li>Your disturbance rating is going up rather than down</li>
          <li>You feel detached from your body, or the room feels unreal</li>
          <li>You cannot remember what you were just doing</li>
          <li>Your heart is racing and you cannot settle</li>
          <li>
            You feel like you are back in the memory rather than looking at it
          </li>
        </ul>
        <p>
          Stopping is not failing. In a session, let the set end, return to your
          safe place or a grounding technique, and close out before you leave. If
          you are mid-set, the “I need help now” button opens crisis resources at
          any point.
        </p>

        <h2>Contact a professional before using {BRAND_SPOKEN} again if</h2>
        <ul>
          <li>Difficult material keeps surfacing outside sessions</li>
          <li>You feel worse rather than better over several days</li>
          <li>You are avoiding things you used to do</li>
          <li>
            You are using sessions to punish yourself rather than to process
          </li>
        </ul>
        <p>
          These are signs the work needs a trained clinician holding the room,
          not a self-help tool. An{" "}
          <a
            href="https://www.emdria.org/find-an-emdr-therapist/"
            target="_blank"
            rel="noopener noreferrer"
          >
            EMDR-trained therapist
          </a>{" "}
          through EMDRIA is a good place to start.
        </p>

        <h2>Get help immediately if</h2>
        <ul>
          <li>You have thoughts of harming yourself or someone else</li>
          <li>You feel unable to keep yourself safe</li>
          <li>You are in crisis</li>
        </ul>
        <p>
          In the US, call or text <a href="tel:988">988</a> (Suicide &amp; Crisis
          Lifeline). Outside the US, contact your local emergency number or a
          crisis line in your country — you can{" "}
          <a
            href="https://findahelpline.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            find a local helpline
          </a>{" "}
          for your region.
        </p>

        <h2>Who should not use {BRAND_SPOKEN}</h2>
        <p>
          Self-directed bilateral stimulation is not appropriate for everyone.
          Please work with a clinician instead if you are under 18, in an active
          crisis, or you have a dissociative disorder, complex or developmental
          trauma, or psychosis. For more on the boundary between what the app can
          and cannot do, see{" "}
          <Link href="/emdr">how a Nura session works</Link> and{" "}
          <Link href="/limits">what Nura does not do</Link>.
        </p>

        <p className="frontend-legal-note">
          {BRAND_SPOKEN} is self-help software. It is not a licensed therapist,
          not a medical device, and it does not diagnose or treat any condition.
          Read the <Link href="/terms">Terms</Link> and{" "}
          <Link href="/privacy">Privacy policy</Link> for how the app works and
          how your data is handled.
        </p>
      </article>
    </FrontendShell>
  );
}

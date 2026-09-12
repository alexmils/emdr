import Link from "next/link";
import { FrontendBreadcrumbs } from "@/app/components/frontend/FrontendBreadcrumbs";
import { BRAND_SPOKEN } from "@/lib/brand";
import "./public-cluster.css";

export function EditorialView() {
  return (
    <article className="fe-cluster">
      <div className="fe-cluster-inner">
        <FrontendBreadcrumbs
          items={[
            { href: "/", label: "Home" },
            { href: "/about", label: "About" },
            { label: "How we write" },
          ]}
        />
        <p className="fe-cluster-kicker">Editorial</p>
        <h1>How we write these guides</h1>
        <p className="fe-cluster-dek">
          Public pages on Nura are self-help explainers. They are not a
          clinician’s letterhead, and they are not signed by a licensed EMDR
          therapist.
        </p>

        <div className="fe-cluster-body">
          <section>
            <h2>What you are reading</h2>
            <p>
              The{" "}
              <Link href="/blog">guides</Link> describe how EMDR-style visual
              sets work in this app: a moving ball, Guided and Free modes,
              grounding, and when to stop. They exist so search and a tired
              Tuesday night can meet the same honest sentences.
            </p>
            <p>
              They are written by the {BRAND_SPOKEN} product team. Dates on each
              article are when that page was last edited, not a medical review
              stamp.
            </p>
          </section>

          <section>
            <h2>What we will not put on the page</h2>
            <p>
              We will not invent a named clinical advisor to look like a
              directory of therapists. We do not currently publish a licensed
              EMDR clinician as author or reviewer of these guides. If that
              person exists later, they will be named here with credentials you
              can check — not a stock bio.
            </p>
            <p>
              We also will not claim Nura treats PTSD, diagnoses anything, or
              replaces the person who can see your face.
            </p>
          </section>

          <section>
            <h2>How that shows up in a session</h2>
            <p>
              The differentiator is in the product, not in a white coat:{" "}
              <Link href="/emdr">
                visual sets with a moving ball in a Nura session
              </Link>
              . Chat that only talks about EMDR is not a set. This software
              still is not emergency care.
            </p>
          </section>

          <section>
            <h2>If you need a human</h2>
            <p>
              Use local emergency services if you are unsafe. For clinical EMDR,
              you need a trained person — not this site. Questions about the
              product: hello@nurahelp.com.
            </p>
          </section>
        </div>

        <p className="fe-cluster-note">
          {BRAND_SPOKEN} is self-help software — not a licensed therapist, not
          emergency care, and not a medical device.
        </p>
      </div>
    </article>
  );
}

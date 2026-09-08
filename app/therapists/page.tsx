import { FrontendShell } from "@/app/components/frontend/FrontendShell";
import { LOGIN_PATH } from "@/lib/app-base";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Find a therapist",
  description:
    "Coming soon: match with a licensed clinician through Nura. Guided EMDR Support is available today.",
};

export default function TherapistsPage() {
  return (
    <FrontendShell>
      <article className="frontend-legal">
        <h1>Find a therapist</h1>
        <p>
          Matching with a licensed clinician is coming. Until then, Nura
          offers guided EMDR Support and resources so you can start with a
          calm, structured session.
        </p>
        <p>
          If you need a person now, look for a licensed therapist in your area.
          Nura is not emergency care.
        </p>
        <div className="frontend-hero-actions">
          <Link href={LOGIN_PATH} className="frontend-btn-primary">
            Use EMDR Support
          </Link>
          <Link href="/therapy" className="frontend-btn-ghost">
            Therapy hub
          </Link>
        </div>
      </article>
    </FrontendShell>
  );
}

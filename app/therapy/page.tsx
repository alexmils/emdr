import { FrontendShell } from "@/app/components/frontend/FrontendShell";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Therapy",
  description:
    "Therapy resources and guided support. EMDR first; more healthcare practices to follow.",
};

export default function TherapyPage() {
  return (
    <FrontendShell>
      <article className="frontend-legal">
        <h1>Therapy resources</h1>
        <p>
          Nura is built for therapy support — not a single modality forever.
          EMDR is first. Other practices will land here as we add them.
        </p>
        <p>
          Today you can read how EMDR sessions work, then open the app for
          guided or free bilateral stimulation. Later this hub will cover more
          approaches and how they fit with live clinicians.
        </p>
        <div className="frontend-hero-actions">
          <Link href="/emdr" className="frontend-btn-primary">
            EMDR Support
          </Link>
          <Link href="/resources" className="frontend-btn-ghost">
            Guides
          </Link>
          <Link href="/therapists" className="frontend-btn-ghost">
            Find a therapist
          </Link>
        </div>
      </article>
    </FrontendShell>
  );
}

import { FrontendShell } from "@/app/components/frontend/FrontendShell";
import { LOGIN_PATH } from "@/lib/app-base";
import { BRAND_TAGLINE } from "@/lib/brand";
import Link from "next/link";

export default function HomePage() {
  return (
    <FrontendShell>
      <section className="frontend-hero">
        <p className="frontend-eyebrow">Nura</p>
        <h1 className="frontend-hero-title">{BRAND_TAGLINE}</h1>
        <p className="frontend-hero-sub">
          A calm place for guided EMDR sessions, therapy resources, and — soon —
          finding a real clinician. Self-help today, a person when you need one.
        </p>
        <div className="frontend-hero-actions">
          <Link href={LOGIN_PATH} className="frontend-btn-primary">
            Get started
          </Link>
          <Link href="/emdr" className="frontend-btn-ghost">
            What is EMDR
          </Link>
        </div>
      </section>

      <section className="frontend-offers" aria-label="What Nura offers">
        <Link href="/emdr" className="frontend-offer">
          <p className="frontend-offer-kicker">Now</p>
          <h2>EMDR Support</h2>
          <p>
            Guided sessions with visual bilateral stimulation, voice, and an
            on-protocol session guide.
          </p>
        </Link>
        <Link href="/therapy" className="frontend-offer">
          <p className="frontend-offer-kicker">Now</p>
          <h2>Therapy resources</h2>
          <p>
            Clear explainers for therapy practices — starting with EMDR, with
            more modalities to follow.
          </p>
        </Link>
        <Link href="/therapists" className="frontend-offer">
          <p className="frontend-offer-kicker">Coming</p>
          <h2>Find a therapist</h2>
          <p>
            Match with a licensed clinician when a guided session is not enough.
          </p>
        </Link>
      </section>

      <p className="frontend-disclaimer">
        Nura is a self-help wellness tool. It is not a licensed therapist, not
        emergency care, and not a medical device. If you are in crisis, contact
        local emergency services.
      </p>
    </FrontendShell>
  );
}

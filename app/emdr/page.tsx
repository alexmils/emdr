import { FrontendShell } from "@/app/components/frontend/FrontendShell";
import { FrontendBreadcrumbs } from "@/app/components/frontend/FrontendBreadcrumbs";
import { EmdrKeepReading } from "@/app/components/frontend/EmdrKeepReading";
import { LOGIN_PATH } from "@/lib/app-base";
import { buildCachedPageMetadata } from "@/lib/site-seo-cache";
import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 3600; // ISR: static HTML, revalidated hourly

export async function generateMetadata(): Promise<Metadata> {
  return buildCachedPageMetadata("emdr");
}

export default function EmdrPage() {
  return (
    <FrontendShell>
      <article className="frontend-legal">
        <FrontendBreadcrumbs
          items={[
            { href: "/", label: "Home" },
            { label: "EMDR" },
          ]}
        />
        <h1>EMDR Support</h1>
        <p>
          EMDR (Eye Movement Desensitization and Reprocessing) is a structured
          therapy approach that uses bilateral stimulation — often eye movements,
          sounds, or taps — while you work with a memory or feeling.
        </p>
        <p>
          Nura offers a calm workspace for EMDR Support: a moving ball for
          visual sets, optional voice, and a guided session that follows a clear
          protocol. It is a self-help tool, not a licensed therapist or
          emergency care.
        </p>
        <p>
          A typical session starts with intake and grounding, then sets with the
          moving ball, then a short check-in. You can also use Free mode for the
          ball only.
        </p>
        <div className="frontend-hero-actions">
          <Link href={LOGIN_PATH} className="frontend-btn-primary">
            Start a session
          </Link>
          <Link href="/resources" className="frontend-btn-ghost">
            Resources
          </Link>
        </div>
        <EmdrKeepReading />
      </article>
    </FrontendShell>
  );
}

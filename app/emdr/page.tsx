import { FrontendShell } from "@/app/components/frontend/FrontendShell";
import { LOGIN_PATH } from "@/lib/app-base";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "EMDR Support",
  description:
    "What EMDR is, how bilateral stimulation (BLS) works, and how a Nura session is structured.",
};

export default function EmdrPage() {
  return (
    <FrontendShell>
      <article className="frontend-legal">
        <h1>EMDR Support</h1>
        <p>
          EMDR (Eye Movement Desensitization and Reprocessing) is a structured
          therapy approach that uses bilateral stimulation — often eye movements,
          sounds, or taps — while you work with a memory or feeling.
        </p>
        <p>
          Nura offers a calm workspace for EMDR Support: a visual BLS ball,
          optional voice, and a guided session that follows a clear protocol. It
          is a self-help tool, not a replacement for a licensed clinician.
        </p>
        <p>
          A typical session starts with intake and grounding, then sets of
          bilateral stimulation, then a short check-in. You can also use Free
          mode for BLS only.
        </p>
        <div className="frontend-hero-actions">
          <Link href={LOGIN_PATH} className="frontend-btn-primary">
            Start a session
          </Link>
          <Link href="/resources" className="frontend-btn-ghost">
            Resources
          </Link>
        </div>
      </article>
    </FrontendShell>
  );
}

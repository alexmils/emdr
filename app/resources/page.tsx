import { FrontendShell } from "@/app/components/frontend/FrontendShell";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Guides for EMDR, bilateral stimulation, and therapy support on Nura.",
};

export default function ResourcesPage() {
  return (
    <FrontendShell>
      <article className="frontend-legal">
        <h1>Resources</h1>
        <p>
          Short guides — not a blog dump. We will grow this library as Nura
          expands beyond EMDR.
        </p>
        <p>
          <Link href="/emdr">What EMDR is</Link>
          {" · "}
          <Link href="/emdr">How a session is structured</Link>
          {" · "}
          <Link href="/emdr">Bilateral stimulation</Link>
        </p>
        <p>
          Nura is not a licensed therapist. Use these pages to understand the
          tool; seek professional care for clinical needs.
        </p>
      </article>
    </FrontendShell>
  );
}

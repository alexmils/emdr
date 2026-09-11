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
          Short guides live in the app library after you sign in. This public
          page stays a light overview.
        </p>
        <p>
          <Link href="/app/resources">Open Resources in the app</Link>
          {" · "}
          <Link href="/about">About Nura</Link>
        </p>
        <p>
          Nura is not a licensed therapist. Use these pages to understand the
          tool; seek professional care for clinical needs.
        </p>
      </article>
    </FrontendShell>
  );
}

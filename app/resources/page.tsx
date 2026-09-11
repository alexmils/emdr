import { FrontendShell } from "@/app/components/frontend/FrontendShell";
import { buildPageMetadata } from "@/lib/site-seo";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("resources");
}

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

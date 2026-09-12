import { FrontendShell } from "@/app/components/frontend/FrontendShell";
import { buildCachedPageMetadata } from "@/lib/site-seo-cache";
import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 3600; // ISR: static HTML, revalidated hourly

export async function generateMetadata(): Promise<Metadata> {
  return buildCachedPageMetadata("resources");
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

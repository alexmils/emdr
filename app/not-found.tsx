import { FrontendShell } from "@/app/components/frontend/FrontendShell";
import { APP_BASE } from "@/lib/app-base";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <FrontendShell>
      <article className="frontend-not-found">
        <p className="frontend-not-found-code" aria-hidden>
          404
        </p>
        <h1>Page not found</h1>
        <p>
          That link doesn&apos;t lead anywhere in Nura. Head home, or open the
          app.
        </p>
        <div className="frontend-hero-actions">
          <Link href="/" className="frontend-btn-primary">
            Home
          </Link>
          <Link href={APP_BASE} className="frontend-btn-ghost">
            Open app
          </Link>
        </div>
      </article>
    </FrontendShell>
  );
}

import { FrontendShell } from "@/app/components/frontend/FrontendShell";
import { appPath, LOGIN_PATH } from "@/lib/app-base";
import { BRAND_SPOKEN, BRAND_TAGLINE } from "@/lib/brand";
import { buildCachedPageMetadata } from "@/lib/site-seo-cache";
import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 3600; // ISR: static HTML, revalidated hourly

export async function generateMetadata(): Promise<Metadata> {
  return buildCachedPageMetadata("about");
}

export default function AboutPage() {
  return (
    <FrontendShell>
      <article className="frontend-legal">
        <h1>About {BRAND_SPOKEN}</h1>
        <p>{BRAND_TAGLINE}</p>
        <p>
          {BRAND_SPOKEN} is a calm workspace for guided EMDR sessions and therapy
          resources — structured support in the app, on your schedule. Sessions
          follow a clear protocol with optional voice guidance, or you can use
          Free mode for visual sets on your own.
        </p>
        <p>
          We built Nura for people who want practice between sessions, or a quiet
          place to run sets without a clinical dashboard. It is self-help
          software, not a licensed therapist, not emergency care, and not a
          medical device.
        </p>
        <div className="frontend-hero-actions">
          <Link href={appPath("/create-account")} className="frontend-btn-primary">
            Get started
          </Link>
          <Link href="/resources" className="frontend-btn-ghost">
            Resources
          </Link>
          <Link href={LOGIN_PATH} className="frontend-btn-ghost">
            Sign in
          </Link>
        </div>
      </article>
    </FrontendShell>
  );
}

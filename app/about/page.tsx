import { FrontendShell } from "@/app/components/frontend/FrontendShell";
import { FrontendBreadcrumbs } from "@/app/components/frontend/FrontendBreadcrumbs";
import { appPath, LOGIN_PATH } from "@/lib/app-base";
import { BRAND_SPOKEN, BRAND_TAGLINE } from "@/lib/brand";
import { buildCachedPageMetadata } from "@/lib/site-seo-cache";
import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 3600; // PUBLIC_PAGE_REVALIDATE_SECONDS

export async function generateMetadata(): Promise<Metadata> {
  return buildCachedPageMetadata("about");
}

export default function AboutPage() {
  return (
    <FrontendShell>
      <article className="frontend-legal">
        <FrontendBreadcrumbs
          items={[
            { href: "/", label: "Home" },
            { label: "About" },
          ]}
        />
        <h1>About the EMDR therapy online app</h1>
        <p>{BRAND_TAGLINE}</p>
        <p>
          {BRAND_SPOKEN} is a calm workspace for agent-guided EMDR sessions and
          therapy resources — structured support in the app, on your schedule.
          Sessions follow a clear protocol with a session agent and optional
          voice, or you can use Free for visual sets on your own — no agent, no
          chat.
        </p>
        <p>
          We built Nura for people who want practice between sessions, or a quiet
          place to run sets without a clinical dashboard. It is self-help
          software, not a licensed therapist, not emergency care, and not a
          medical device. How the public guides are written is on{" "}
          <Link href="/editorial">How we write</Link>.
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

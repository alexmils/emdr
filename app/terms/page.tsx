import { FrontendBreadcrumbs } from "@/app/components/frontend/FrontendBreadcrumbs";
import { FrontendShell } from "@/app/components/frontend/FrontendShell";
import { BRAND_LEGAL } from "@/lib/brand";
import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/lib/public-page-cache";
import { buildCachedPageMetadata } from "@/lib/site-seo-cache";
import type { Metadata } from "next";

export const revalidate = PUBLIC_PAGE_REVALIDATE_SECONDS;

export async function generateMetadata(): Promise<Metadata> {
  return buildCachedPageMetadata("terms");
}

export default function TermsPage() {
  return (
    <FrontendShell>
      <article className="frontend-legal">
        <FrontendBreadcrumbs
          items={[
            { href: "/", label: "Home" },
            { label: "Terms" },
          ]}
        />
        <h1>Terms of service</h1>
        <p>
          This is a placeholder terms page for {BRAND_LEGAL}. The product is
          intended as an EMDR Support tool — not a substitute for professional
          clinical care.
        </p>
        <p>Replace this stub with your full terms before production launch.</p>
      </article>
    </FrontendShell>
  );
}

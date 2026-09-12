import { FrontendBreadcrumbs } from "@/app/components/frontend/FrontendBreadcrumbs";
import { LegalOpenHelp } from "@/app/components/frontend/LegalOpenHelp";
import { FrontendShell } from "@/app/components/frontend/FrontendShell";
import {
  formatLegalEntityBlock,
  LEGAL_DOC_VERSION,
} from "@/lib/legal-entity";
import { loadPreparedTermsHtml, TERMS_TOC } from "@/lib/legal/terms-html";
import { buildCachedPageMetadata } from "@/lib/site-seo-cache";
import type { Metadata } from "next";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return buildCachedPageMetadata("terms");
}

export default function TermsPage() {
  const bodyHtml = loadPreparedTermsHtml();

  return (
    <FrontendShell>
      <LegalOpenHelp />
      <article className="frontend-legal frontend-legal--long frontend-legal--termly">
        <FrontendBreadcrumbs
          items={[
            { href: "/", label: "Home" },
            { label: "Terms" },
          ]}
        />
        <h1>Terms of service</h1>
        <p className="frontend-legal-meta">
          Version {LEGAL_DOC_VERSION.terms} · Last updated 12 September 2026
        </p>
        <pre className="frontend-legal-pre">{formatLegalEntityBlock()}</pre>

        <nav className="frontend-legal-toc" aria-label="Terms sections">
          <h2 className="frontend-legal-toc-title">On this page</h2>
          <ol className="frontend-legal-toc-list">
            {TERMS_TOC.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`}>{item.label}</a>
              </li>
            ))}
          </ol>
        </nav>

        <div
          className="frontend-legal-termly"
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
      </article>
    </FrontendShell>
  );
}

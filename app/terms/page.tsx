import { LegalOpenHelp } from "@/app/components/frontend/LegalOpenHelp";
import { FrontendShell } from "@/app/components/frontend/FrontendShell";
import { JsonLd } from "@/app/components/frontend/JsonLd";
import {
  formatLegalEntityBlock,
  LEGAL_DOC_VERSION,
} from "@/lib/legal-entity";
import { loadPreparedTermsHtml, TERMS_TOC } from "@/lib/legal/terms-html";
import { getPublicAppUrl } from "@/lib/platform-settings";
import { buildLegalWebPageJsonLd } from "@/lib/seo-jsonld";
import { buildCachedPageMetadata } from "@/lib/site-seo-cache";
import { siteOrigin } from "@/lib/site-seo";
import type { Metadata } from "next";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return buildCachedPageMetadata("terms");
}

export default async function TermsPage() {
  const bodyHtml = loadPreparedTermsHtml();
  let publicUrl: string | undefined;
  try {
    publicUrl = await getPublicAppUrl();
  } catch {
    publicUrl = undefined;
  }
  const origin = siteOrigin(publicUrl);

  return (
    <FrontendShell>
      <JsonLd
        data={buildLegalWebPageJsonLd({
          origin,
          path: "/terms",
          name: "Terms of service",
          description:
            "Terms for using Nura, the online EMDR therapy app operated by Receptly LLC.",
        })}
      />
      <LegalOpenHelp />
      <article className="frontend-legal frontend-legal--long frontend-legal--prepared">
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
          className="frontend-legal-body"
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
      </article>
    </FrontendShell>
  );
}

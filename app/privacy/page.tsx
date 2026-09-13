import { LegalOpenHelp } from "@/app/components/frontend/LegalOpenHelp";
import { FrontendShell } from "@/app/components/frontend/FrontendShell";
import { JsonLd } from "@/app/components/frontend/JsonLd";
import {
  formatLegalEntityBlock,
  LEGAL_DOC_VERSION,
} from "@/lib/legal-entity";
import {
  loadPreparedPrivacyHtml,
  PRIVACY_TOC,
} from "@/lib/legal/privacy-html";
import { getPublicAppUrl } from "@/lib/platform-settings";
import { buildLegalWebPageJsonLd } from "@/lib/seo-jsonld";
import { buildCachedPageMetadata } from "@/lib/site-seo-cache";
import { siteOrigin } from "@/lib/site-seo";
import type { Metadata } from "next";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return buildCachedPageMetadata("privacy");
}

export default async function PrivacyPage() {
  const bodyHtml = loadPreparedPrivacyHtml();
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
          path: "/privacy",
          name: "Privacy policy",
          description:
            "How Receptly LLC handles account, session, and billing data for the Nura EMDR therapy app.",
        })}
      />
      <LegalOpenHelp />
      <article className="frontend-legal frontend-legal--long frontend-legal--prepared">
        <h1>Privacy policy</h1>
        <p className="frontend-legal-meta">
          Version {LEGAL_DOC_VERSION.privacy} · Last updated 13 September 2026
        </p>
        <pre className="frontend-legal-pre">{formatLegalEntityBlock()}</pre>

        <nav className="frontend-legal-toc" aria-label="Privacy sections">
          <h2 className="frontend-legal-toc-title">On this page</h2>
          <ol className="frontend-legal-toc-list">
            {PRIVACY_TOC.map((item) => (
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

import { ChangelogView } from "@/app/components/frontend/ChangelogView";
import { FrontendShell } from "@/app/components/frontend/FrontendShell";
import { JsonLd } from "@/app/components/frontend/JsonLd";
import { loadPublicChangelog } from "@/lib/changelog-public";
import { getPublicAppUrl } from "@/lib/platform-settings";
import {
  breadcrumbJsonLd,
  organizationJsonLd,
} from "@/lib/seo-jsonld";
import { buildCachedPageMetadata } from "@/lib/site-seo-cache";
import { siteOrigin } from "@/lib/site-seo";
import type { Metadata } from "next";

export const revalidate = 3600; // PUBLIC_PAGE_REVALIDATE_SECONDS

export async function generateMetadata(): Promise<Metadata> {
  return buildCachedPageMetadata("changelog");
}

export default async function ChangelogPage() {
  const releases = loadPublicChangelog();
  let publicUrl: string | undefined;
  try {
    publicUrl = await getPublicAppUrl();
  } catch {
    publicUrl = undefined;
  }
  const origin = siteOrigin(publicUrl);
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      organizationJsonLd(origin),
      breadcrumbJsonLd(origin, [
        { name: "Home", path: "/" },
        { name: "What's new", path: "/changelog" },
      ]),
    ],
  };

  return (
    <FrontendShell>
      <JsonLd data={graph} />
      <ChangelogView releases={releases} />
    </FrontendShell>
  );
}

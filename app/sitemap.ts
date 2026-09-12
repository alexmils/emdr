import type { MetadataRoute } from "next";
import { getPublicAppUrl } from "@/lib/platform-settings";
import { buildPublicSitemap } from "@/lib/public-sitemap";
import { siteOrigin } from "@/lib/site-seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let publicUrl: string | undefined;
  try {
    publicUrl = await getPublicAppUrl();
  } catch {
    publicUrl = undefined;
  }
  return buildPublicSitemap(siteOrigin(publicUrl));
}

import type { MetadataRoute } from "next";
import { getPublicAppUrl } from "@/lib/platform-settings";
import { siteOrigin } from "@/lib/site-seo";

export default async function robots(): Promise<MetadataRoute.Robots> {
  let publicUrl: string | undefined;
  try {
    publicUrl = await getPublicAppUrl();
  } catch {
    publicUrl = undefined;
  }
  const origin = siteOrigin(publicUrl);
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/privacy",
        "/terms",
        "/about",
        "/emdr",
        "/resources",
      ],
      disallow: ["/app", "/admin", "/api", "/design"],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}

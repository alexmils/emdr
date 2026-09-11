import type { MetadataRoute } from "next";
import { getPublicAppUrl } from "@/lib/platform-settings";
import { siteOrigin } from "@/lib/site-seo";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = siteOrigin(await getPublicAppUrl());
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
      disallow: ["/app", "/admin", "/api"],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}

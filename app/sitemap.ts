import type { MetadataRoute } from "next";
import { getPublicAppUrl } from "@/lib/platform-settings";
import { siteOrigin } from "@/lib/site-seo";

const PUBLIC_PATHS = [
  "/",
  "/about",
  "/emdr",
  "/resources",
  "/privacy",
  "/terms",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin(await getPublicAppUrl());
  return PUBLIC_PATHS.map((path) => ({
    url: path === "/" ? `${origin}/` : `${origin}${path}`,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}

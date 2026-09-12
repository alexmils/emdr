import type { MetadataRoute } from "next";
import {
  clusterSitemapPaths,
  latestClusterModified,
} from "@/lib/content-cluster";

/** Last real edit dates for static marketing URLs (ISO date, midnight UTC). */
const STATIC_LASTMOD: Record<string, string> = {
  "/about": "2026-09-12",
  "/editorial": "2026-09-12",
  "/emdr": "2026-09-12",
  "/privacy": "2026-09-08",
  "/terms": "2026-09-08",
};

function atUtc(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

/**
 * Public sitemap. Google uses lastmod; changefreq/priority are omitted.
 */
export function buildPublicSitemap(origin: string): MetadataRoute.Sitemap {
  const base = origin.replace(/\/$/, "");
  const clusterLatest = latestClusterModified();

  const staticPaths = [
    "/",
    "/about",
    "/editorial",
    "/emdr",
    "/resources",
    "/blog",
    "/privacy",
    "/terms",
  ] as const;

  const pages: MetadataRoute.Sitemap = staticPaths.map((path) => {
    const lastModified =
      path === "/" || path === "/blog" || path === "/resources"
        ? clusterLatest
        : atUtc(STATIC_LASTMOD[path] ?? "2026-09-12");
    return {
      url: path === "/" ? `${base}/` : `${base}${path}`,
      lastModified,
    };
  });

  const articles: MetadataRoute.Sitemap = clusterSitemapPaths().map(
    ({ path, lastModified }) => ({
      url: `${base}${path}`,
      lastModified,
    })
  );

  return [...pages, ...articles];
}

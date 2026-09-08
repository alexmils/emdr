import type { MetadataRoute } from "next";
import { brandMetadataBase } from "@/lib/brand";

const PUBLIC_PATHS = [
  "/",
  "/emdr",
  "/therapy",
  "/resources",
  "/therapists",
  "/privacy",
  "/terms",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = brandMetadataBase().origin;
  return PUBLIC_PATHS.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}

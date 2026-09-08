import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/privacy",
        "/terms",
        "/emdr",
        "/therapy",
        "/resources",
        "/therapists",
      ],
      disallow: ["/app", "/admin", "/api"],
    },
  };
}

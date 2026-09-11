import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
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
  };
}

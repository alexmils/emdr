import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  async redirects() {
    return [
      {
        source: "/therapy",
        destination: "/resources",
        permanent: true,
      },
      {
        source: "/therapy/:path*",
        destination: "/resources",
        permanent: true,
      },
      {
        source: "/therapists",
        destination: "/resources",
        permanent: true,
      },
      {
        source: "/therapists/:path*",
        destination: "/resources",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "images.pexels.com", pathname: "/**" },
    ],
  },
  // Non-empty turbopack block silences the warning (empty `{}` is ignored by Next's check).
  // webpack() below only applies to `npm run dev:webpack` (poll/cache for Windows).
  turbopack: {
    root: process.cwd(),
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 500,
      };
    }
    return config;
  },
};

export default nextConfig;

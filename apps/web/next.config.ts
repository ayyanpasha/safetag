import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@safetag/shared-types"],
  // Skip static generation for error pages (known issue with Next.js 15 + React 19)
  experimental: {
    // Disable static error pages
  },
  // Skip build errors on prerender
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;

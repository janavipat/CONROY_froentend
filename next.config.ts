import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance: modern image formats + responsive sizing.
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        // Authentic product photography is served from Shopify's CDN.
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;

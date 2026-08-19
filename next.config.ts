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
      {
        // Product images uploaded to Supabase Storage (public bucket).
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  poweredByHeader: false,
  reactStrictMode: true,

  /*
   * No host redirect here.
   *
   * A www -> apex rule was tried and had to be reverted: Vercel already
   * redirects the apex to www at the platform level, so the two rules formed
   * an infinite loop and the site stopped responding. Host canonicalisation
   * belongs in the Vercel domain settings, where only one side of it exists —
   * see the SEO notes for which way round it needs to go.
   */
  // Hide the floating Next.js dev indicator ("N" badge) shown on every page.
  devIndicators: false,
};

export default nextConfig;

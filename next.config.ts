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

  /**
   * One canonical host.
   *
   * www.conroy.global currently serves the site on a 200 rather than
   * redirecting, so every page exists at two addresses. The canonical tags
   * already point at the apex, which stops it becoming a duplicate-content
   * problem, but a permanent redirect is what actually consolidates the
   * signals — and /about/ was resolving to the www host, so a trailing slash
   * moved a visitor onto the non-canonical domain.
   *
   * If the apex is ever retired in favour of www, this rule must be inverted
   * along with SITE.url.
   */
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.conroy.global" }],
        destination: "https://conroy.global/:path*",
        permanent: true,
      },
    ];
  },
  // Hide the floating Next.js dev indicator ("N" badge) shown on every page.
  devIndicators: false,
};

export default nextConfig;

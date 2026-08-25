import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance: modern image formats + responsive sizing.
  images: {
    formats: ["image/avif", "image/webp"],

    /*
     * Every distinct width × quality is a separate optimizer transformation,
     * and transformations are metered. The defaults generate fifteen widths
     * per image — eight device sizes (640…3840) plus seven image sizes — so a
     * catalogue of ~90 photographs can request well over a thousand
     * transformations, which is what exhausted the quota and made /_next/image
     * answer 402 for anything not already cached.
     *
     * These lists are cut to what the layouts actually ask for. The widest
     * `sizes` on the site is 100vw (hero) and then 50vw; nothing is laid out
     * at 2048 or 3840, so those were pure cost. Fixed-size images range from
     * 40px to 184px, which the imageSizes list below covers.
     *
     * Trimming to 4 + 5 takes the worst case from fifteen variants per image
     * to nine.
     */
    deviceSizes: [640, 828, 1080, 1920],
    imageSizes: [48, 96, 128, 256, 384],

    // Next 16 requires an explicit allowlist. One quality keeps each width to
    // a single transformation rather than one per quality value requested.
    qualities: [75],

    /*
     * 31 days rather than the 4-hour default. Once a variant expires it is
     * re-optimised and metered again, so a short TTL keeps re-billing the same
     * unchanged photograph. The docs recommend raising this to reduce
     * revalidations. Product images are content-addressed — a new upload gets
     * a new filename — so a long TTL cannot serve a stale image.
     */
    minimumCacheTTL: 2_678_400,
    /*
     * Exactly the two hosts the catalogue serves from, and nothing else.
     *
     * A host allowed here can be optimised through this site's own
     * /_next/image endpoint, and every such request is metered — so an
     * over-broad entry is both a cost and an open-proxy surface. The previous
     * list allowed images.unsplash.com, which nothing references (checked
     * against the code, the product API and the collection API), and any
     * *.supabase.co project rather than this store's own.
     */
    remotePatterns: [
      {
        // The four original denim styles are still served from Shopify's CDN.
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/s/files/**",
      },
      {
        // Everything uploaded through admin: this project's public bucket.
        // Pinned to the project host rather than *.supabase.co. If the
        // Supabase project ever changes, this hostname must change with
        // NEXT_PUBLIC_SUPABASE_URL or images will stop optimising.
        protocol: "https",
        hostname: "jviqryberbjmvpuqcuob.supabase.co",
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

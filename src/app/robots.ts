import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * Crawl rules.
 *
 * /admin was previously absent here, so the whole admin panel was crawlable —
 * the pages carry a noindex tag, but a disallow keeps crawlers out of an area
 * that has nothing to offer them in the first place.
 *
 * Nothing under /_next is blocked: Google renders the page before judging it,
 * and blocking the CSS or JS bundles makes the storefront look broken to the
 * crawler even though it renders perfectly for a person.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin",
        "/admin/",
        "/account/",
        "/cart",
        "/checkout",
        "/checkout/",
        // Ranks nothing and would otherwise be crawled once per query string.
        "/search",
        "/wishlist",
      ],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}

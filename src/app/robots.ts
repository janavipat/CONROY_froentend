import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { isStaging } from "@/lib/staging";

export default function robots(): MetadataRoute.Robots {
  // Staging is a copy of the storefront on a different domain. Indexed, it
  // would compete with conroy.global for the same queries and split its
  // ranking — so the test deployment is closed to crawlers entirely, and
  // advertises no sitemap or canonical host to follow back.
  if (isStaging) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/cart", "/account/"],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}

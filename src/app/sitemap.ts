import type { MetadataRoute } from "next";
import { COLLECTIONS, PRODUCTS } from "@/lib/products";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = (
    [
      { url: `${SITE.url}/`, changeFrequency: "weekly", priority: 1 },
      { url: `${SITE.url}/collections/all`, changeFrequency: "daily", priority: 0.9 },
      { url: `${SITE.url}/about`, changeFrequency: "monthly", priority: 0.7 },
      { url: `${SITE.url}/contact`, changeFrequency: "monthly", priority: 0.6 },
      { url: `${SITE.url}/policy`, changeFrequency: "yearly", priority: 0.4 },
      { url: `${SITE.url}/search`, changeFrequency: "monthly", priority: 0.3 },
    ] as const
  ).map((r) => ({ ...r, lastModified: now }));

  const collectionRoutes: MetadataRoute.Sitemap = COLLECTIONS.filter(
    (c) => c.handle !== "all",
  ).map((c) => ({
    url: `${SITE.url}/collections/${c.handle}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const productRoutes: MetadataRoute.Sitemap = PRODUCTS.map((p) => ({
    url: `${SITE.url}/products/${p.handle}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...collectionRoutes, ...productRoutes];
}

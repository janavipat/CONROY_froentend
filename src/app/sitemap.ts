import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { DENIM_VIEWS } from "@/lib/catalog-taxonomy";
import { fetchAllProducts, fetchCollections } from "@/services/catalog";

/**
 * The sitemap, built from the live catalogue.
 *
 * It used to be generated from the bundled fallback catalogue, which holds
 * four denim styles and three legacy collection handles — so sixteen products
 * and every category route were missing, while collections that no longer
 * merchandise anything were listed.
 *
 * Search and the account, cart and checkout routes are deliberately absent:
 * they carry no indexable content and are marked noindex at the page level.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const entry = (
    path: string,
    priority: number,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  ) => ({ url: `${SITE.url}${path}`, lastModified: now, changeFrequency, priority });

  const staticRoutes: MetadataRoute.Sitemap = [
    entry("/", 1, "weekly"),
    entry("/new-in", 0.9, "daily"),
    entry("/denim", 0.9, "daily"),
    entry("/t-shirts", 0.9, "daily"),
    entry("/collections", 0.8, "weekly"),
    entry("/collections/all", 0.9, "daily"),
    entry("/shop-the-look", 0.6, "weekly"),
    entry("/about", 0.6, "monthly"),
    entry("/contact", 0.5, "monthly"),
    entry("/policy", 0.4, "yearly"),
    entry("/terms", 0.3, "yearly"),
  ];

  const denimRoutes: MetadataRoute.Sitemap = Object.keys(DENIM_VIEWS).map((fit) =>
    entry(`/denim/${fit}`, 0.8, "weekly"),
  );

  // Read the catalogue once; either call falling back to the bundled data
  // still produces a valid sitemap rather than an empty one.
  const [products, collections] = await Promise.all([
    fetchAllProducts().catch(() => []),
    fetchCollections().catch(() => []),
  ]);

  const collectionRoutes: MetadataRoute.Sitemap = collections
    // "all" is already listed above at a higher priority.
    .filter((c) => c.handle !== "all")
    .map((c) => entry(`/collections/${c.handle}`, 0.7, "weekly"));

  const productRoutes: MetadataRoute.Sitemap = products.map((p) =>
    entry(`/products/${p.handle}`, 0.8, "weekly"),
  );

  return [...staticRoutes, ...denimRoutes, ...collectionRoutes, ...productRoutes];
}

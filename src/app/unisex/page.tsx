import type { Metadata } from "next";
import { listingMetadata } from "@/lib/seo";
import { browseProducts, newestFirst } from "@/services/browse";
import { BrowseLayout } from "@/layouts/BrowseLayout";
import { UNISEX_COLLECTION } from "@/lib/catalog-taxonomy";

/**
 * Every unisex product, whatever its material. Membership is the admin's
 * "unisex" collection (Admin → Collections), read through the existing
 * collection endpoint — the same listing, filters and sorting as /linen.
 */
export async function generateMetadata(): Promise<Metadata> {
  const products = await browseProducts({ collection: UNISEX_COLLECTION });
  const hero = products[0]?.images?.[0];
  return listingMetadata({
    title: "Unisex",
    description: "Unisex pieces from CONROY — premium clothing with a clean, versatile look, for everyone.",
    path: "/unisex",
    image: hero?.src ?? null,
    imageAlt: hero?.alt ?? "Unisex",
  });
}

export default async function UnisexPage() {
  // Newest first, matching the other category pages.
  const products = newestFirst(await browseProducts({ collection: UNISEX_COLLECTION }));
  return (
    <BrowseLayout
      eyebrow="The category"
      title="Unisex"
      description="Pieces made for everyone."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Unisex" }]}
      products={products}
      emptyMessage="No unisex pieces available right now."
    />
  );
}

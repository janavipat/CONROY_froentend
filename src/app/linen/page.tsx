import type { Metadata } from "next";
import { listingMetadata } from "@/lib/seo";
import { browseProducts, newestFirst } from "@/services/browse";
import { BrowseLayout } from "@/layouts/BrowseLayout";
import { isUnisex } from "@/lib/catalog-taxonomy";

/** Men's linen: the Linen product type, minus anything classified unisex (see /unisex). */
async function mensLinen() {
  return (await browseProducts({ productType: "Linen" })).filter((p) => !isUnisex(p));
}

/**
 * Every men's linen product — its own category, alongside /denim and /trousers.
 * Filters on the Linen product type, so linen never mixes into the other
 * listings and they never appear here. Unisex linen lives on /unisex instead.
 */
export async function generateMetadata(): Promise<Metadata> {
  const products = await mensLinen();
  const hero = products[0]?.images?.[0];
  return listingMetadata({
    title: "Men's Linen",
    description: "Men's linen from CONROY — premium pieces with a clean, versatile look.",
    path: "/linen",
    image: hero?.src ?? null,
    imageAlt: hero?.alt ?? "Men's Linen",
  });
}

export default async function LinenPage() {
  // Newest first, so the latest linen piece leads the page.
  const products = newestFirst(await mensLinen());
  return (
    <BrowseLayout
      eyebrow="The category"
      title="All Linen"
      description="Premium linen with a clean, versatile look."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Linen" }]}
      products={products}
      emptyMessage="No linen available right now."
    />
  );
}

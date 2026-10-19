import type { Metadata } from "next";
import { listingMetadata } from "@/lib/seo";
import { browseProducts, newestFirst } from "@/services/browse";
import { BrowseLayout } from "@/layouts/BrowseLayout";

/**
 * Every trouser product — the counterpart of /denim. Filters on the Trousers
 * product type, so jeans never appear here and trousers never appear there.
 */
export async function generateMetadata(): Promise<Metadata> {
  const products = await browseProducts({ productType: "Trousers" });
  const hero = products[0]?.images?.[0];
  return listingMetadata({
    title: "Men's Trousers",
    description: "Men's trousers from CONROY — premium trousers with a clean, versatile look.",
    path: "/trousers",
    image: hero?.src ?? null,
    imageAlt: hero?.alt ?? "Men's Trousers",
  });
}

export default async function TrousersPage() {
  // Newest first, so the latest trouser leads the page.
  const products = newestFirst(await browseProducts({ productType: "Trousers" }));
  return (
    <BrowseLayout
      eyebrow="The category"
      title="All Trousers"
      description="Premium trousers with a clean, versatile look."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Trousers" }]}
      products={products}
      emptyMessage="No trousers available right now."
    />
  );
}

import type { Metadata } from "next";
import { listingMetadata } from "@/lib/seo";
import { browseProducts, newestFirst } from "@/services/browse";
import { BrowseLayout } from "@/layouts/BrowseLayout";

/**
 * Every cotton twill product — its own category, alongside /denim, /trousers
 * and /linen. Filters on the Cotton Twill product type, so any cotton twill
 * piece added in admin appears here, and never in the other listings.
 */
export async function generateMetadata(): Promise<Metadata> {
  const products = await browseProducts({ productType: "Cotton Twill" });
  const hero = products[0]?.images?.[0];
  return listingMetadata({
    title: "Men's Cotton Twill",
    description: "Men's cotton twill from CONROY — premium pieces with a clean, versatile look.",
    path: "/cotton-twill",
    image: hero?.src ?? null,
    imageAlt: hero?.alt ?? "Men's Cotton Twill",
  });
}

export default async function CottonTwillPage() {
  // Newest first, so the latest cotton twill piece leads the page.
  const products = newestFirst(await browseProducts({ productType: "Cotton Twill" }));
  return (
    <BrowseLayout
      eyebrow="The category"
      title="All Cotton Twill"
      description="Premium cotton twill with a clean, versatile look."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Cotton Twill" }]}
      products={products}
      emptyMessage="No cotton twill available right now."
    />
  );
}

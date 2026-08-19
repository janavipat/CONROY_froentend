import type { Metadata } from "next";
import { listingMetadata } from "@/lib/seo";
import { browseProducts } from "@/services/browse";
import { BrowseLayout } from "@/layouts/BrowseLayout";

/**
 * Built at request time so the social card can carry a photograph of the
 * first product actually listed. Declaring `openGraph` without `images`
 * drops the site-wide OG image, which is why these pages previewed with no
 * picture at all.
 */
export async function generateMetadata(): Promise<Metadata> {
  const products = await browseProducts({ productType: "T-Shirt" });
  const hero = products[0]?.images?.[0];
  return listingMetadata({
    title: "Men's T-Shirts",
    description: "Men's cotton and cotton-lycra polo T-shirts from CONROY — regular fit, short sleeve, in black, white, navy, sky blue, bottle green and more. Sizes S–XL.",
    path: "/t-shirts",
    image: hero?.src ?? null,
    imageAlt: hero?.alt ?? "Men's T-Shirts",
  });
}

/**
 * Kept structurally separate from denim: T-shirts have their own category and
 * their own fits, and must never inherit denim's slim/straight/relaxed set.
 * The catalogue holds no T-shirts yet, so this renders an empty state rather
 * than placeholder products.
 */
export default async function TShirtsPage() {
  const products = await browseProducts({ category: "T-Shirts" });
  return (
    <BrowseLayout
      eyebrow="The category"
      title="All T-Shirts"
      description="Everyday essentials in honest cotton."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "T-Shirts" }]}
      products={products}
      emptyMessage="No T-shirts in the catalogue yet. Add one from the admin panel with Category set to T-Shirts."
    />
  );
}

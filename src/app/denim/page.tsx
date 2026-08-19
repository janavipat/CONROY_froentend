import type { Metadata } from "next";
import { listingMetadata } from "@/lib/seo";
import { DENIM_VIEWS } from "@/lib/catalog-taxonomy";
import { browseProducts } from "@/services/browse";
import { BrowseLayout } from "@/layouts/BrowseLayout";

/**
 * Built at request time so the social card can carry a photograph of the
 * first product actually listed. Declaring `openGraph` without `images`
 * drops the site-wide OG image, which is why these pages previewed with no
 * picture at all.
 */
export async function generateMetadata(): Promise<Metadata> {
  const products = await browseProducts({ category: "Denim" });
  const hero = products[0]?.images?.[0];
  return listingMetadata({
    title: "Men's Denim & Jeans",
    description: "Men's jeans from CONROY in slim, straight and relaxed fits — premium denim in black, indigo, light wash and vintage tints. Mid-rise, five-pocket, sizes 28–38.",
    path: "/denim",
    image: hero?.src ?? null,
    imageAlt: hero?.alt ?? "Men's Denim & Jeans",
  });
}

export default async function DenimPage() {
  const products = await browseProducts({ category: "Denim" });
  return (
    <BrowseLayout
      eyebrow="The category"
      title="All Denim"
      description="Honest indigo and washed black, cut to last."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Denim" }]}
      subLinks={Object.entries(DENIM_VIEWS).map(([slug, v]) => ({
        label: v.title,
        href: `/denim/${slug}`,
      }))}
      products={products}
    />
  );
}

import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { fetchAllProducts } from "@/services/catalog";
import { WishlistGrid } from "@/components/product/WishlistGrid";
import { PageHeader } from "@/layouts/PageHeader";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "Pieces you've saved.",
  alternates: { canonical: "/wishlist" },
  robots: { index: false, follow: true },
  openGraph: { title: `Wishlist · ${SITE.name}`, url: `${SITE.url}/wishlist` },
};

/**
 * The wishlist finally has a page. Which products are liked lives in the
 * client-side wishlist context (keyed per visitor), so the catalogue is
 * fetched here and filtered in the client component.
 */
export default async function WishlistPage() {
  const products = await fetchAllProducts();
  return (
    <>
      <PageHeader
        eyebrow="Saved by you"
        title="Wishlist"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Wishlist" }]}
      />
      <WishlistGrid products={products} />
    </>
  );
}

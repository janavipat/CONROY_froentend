import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { fetchNewIn } from "@/services/browse";
import { BrowseLayout } from "@/layouts/BrowseLayout";

export const metadata: Metadata = {
  title: "New In",
  description:
    "The newest CONROY arrivals — premium men's denim and cotton T-shirts, added as each style lands. Free-shipping-eligible orders across India.",
  alternates: { canonical: "/new-in" },
  openGraph: { title: `New In | ${SITE.name}`, url: `${SITE.url}/new-in`, images: [`${SITE.url}/opengraph-image`] },
};

/**
 * New In is a merchandising decision, not an age: products appear here only
 * when an admin sets isNewIn, ordered by newInOrder. createdAt is deliberately
 * not consulted.
 */
export default async function NewInPage() {
  const products = await fetchNewIn();
  return (
    <BrowseLayout
      eyebrow="Just arrived"
      title="New In"
      description="The latest pieces to join the CONROY collection."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "New In" }]}
      products={products}
      emptyMessage="Nothing has been added to New In yet. Mark products as New In from the admin panel."
    />
  );
}

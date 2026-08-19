import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { browseProducts } from "@/services/browse";
import { PageHeader } from "@/layouts/PageHeader";
import { ShopTheLookEdit } from "@/sections/ShopTheLookEdit";

export const metadata: Metadata = {
  title: "Shop the Look",
  description: "Complete CONROY looks, styled and ready to wear.",
  alternates: { canonical: "/shop-the-look" },
  openGraph: { title: `Shop the Look | ${SITE.name}`, url: `${SITE.url}/shop-the-look`, images: [`${SITE.url}/opengraph-image`] },
};

/**
 * A look is a curated set of products with its own editorial image — that
 * needs a data model and admin UI which are still to come. Until then the page
 * shows one edit composed from assets that already exist (brand photography
 * plus live products) rather than an apology, so the route is useful on a live
 * storefront. Nothing here is invented: every piece links to a real product.
 */
export default async function ShopTheLookPage() {
  const denim = await browseProducts({ category: "Denim" });

  return (
    <>
      <PageHeader
        eyebrow="Styled by CONROY"
        title="Shop the Look"
        description="Complete outfits, put together by our team."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Shop the Look" }]}
      />
      <ShopTheLookEdit
        products={denim}
        href="/denim"
        ctaLabel="Shop the denim edit"
        withHeading={false}
      />
    </>
  );
}

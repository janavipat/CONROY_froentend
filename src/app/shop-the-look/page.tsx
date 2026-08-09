import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/layouts/PageHeader";

export const metadata: Metadata = {
  title: "Shop the Look",
  description: "Complete CONROY looks, styled and ready to wear.",
  alternates: { canonical: "/shop-the-look" },
  openGraph: { title: `Shop the Look · ${SITE.name}`, url: `${SITE.url}/shop-the-look` },
};

/**
 * Structural placeholder. A look is a curated set of products with its own
 * editorial image — that needs a data model and admin UI which are out of
 * scope for this phase, so the route exists and states plainly that it's
 * coming rather than showing invented looks.
 */
export default function ShopTheLookPage() {
  return (
    <>
      <PageHeader
        eyebrow="Styled by CONROY"
        title="Shop the Look"
        description="Complete outfits, put together by our team."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Shop the Look" }]}
      />
      <section className="py-section">
        <Container>
          <p className="py-20 text-center text-sm text-stone">
            Looks are being styled and will appear here soon.
          </p>
        </Container>
      </section>
    </>
  );
}

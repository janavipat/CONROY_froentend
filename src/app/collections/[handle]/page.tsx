import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { COLLECTIONS, getCollectionByHandle } from "@/lib/products";
import { fetchCollection } from "@/services/catalog";
import { SITE } from "@/lib/site";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { BoxIcon } from "@/components/ui/Icons";
import { ProductGrid } from "@/components/product/ProductGrid";
import { PageHeader } from "@/layouts/PageHeader";

export function generateStaticParams() {
  return COLLECTIONS.map((c) => ({ handle: c.handle }));
}

export async function generateMetadata(
  props: PageProps<"/collections/[handle]">,
): Promise<Metadata> {
  const { handle } = await props.params;
  // Read through the API first — collections created in admin (e.g. Slim Fit)
  // exist only in the database, not in the bundled fallback catalogue.
  const collection = (await fetchCollection(handle))?.collection ?? getCollectionByHandle(handle);
  if (!collection) return { title: "Collection not found" };

  const title = collection.title;
  return {
    title,
    description: collection.description,
    alternates: { canonical: `/collections/${collection.handle}` },
    openGraph: {
      title: `${title} · ${SITE.name}`,
      description: collection.description,
      url: `${SITE.url}/collections/${collection.handle}`,
      images: [{ url: collection.image, width: 1200, height: 1500, alt: title }],
    },
  };
}

/**
 * Shown when a collection resolves but holds no products — e.g. a fit whose
 * items are all out of stock, or one an admin has yet to populate.
 */
function EmptyCollection({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-16 text-center lg:py-24">
      <span className="grid h-20 w-20 place-items-center rounded-full bg-mist">
        <BoxIcon className="h-9 w-9 text-stone" />
      </span>
      <p className="font-display text-2xl text-ink sm:text-3xl">
        No {title ? `${title} ` : ""}products available at the moment.
      </p>
      <p className="max-w-md text-ink-soft">
        This collection is being restocked. Browse the rest of the range in the meantime.
      </p>
      <Button href="/collections/all">Shop all products</Button>
    </div>
  );
}

export default async function CollectionPage(props: PageProps<"/collections/[handle]">) {
  const { handle } = await props.params;
  const result = await fetchCollection(handle);
  if (!result) notFound();

  const { collection, products } = result;

  return (
    <>
      <PageHeader
        eyebrow={collection.subtitle}
        title={collection.title}
        description={collection.description}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Collection", href: "/collections/all" },
          ...(handle === "all" ? [] : [{ label: collection.title }]),
        ]}
      />
      <section className="py-14 lg:py-20">
        <Container>
          {products.length === 0 ? (
            <EmptyCollection title={handle === "all" ? "" : collection.title} />
          ) : (
            <>
              <p className="mb-8 text-xs tracking-[0.01em] text-stone">
                {products.length} {products.length === 1 ? "product" : "products"}
              </p>
              <ProductGrid products={products} columns={4} priorityCount={4} />
            </>
          )}
        </Container>
      </section>
    </>
  );
}

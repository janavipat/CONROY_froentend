import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { COLLECTIONS, getCollectionByHandle } from "@/lib/products";
import { fetchCollection } from "@/services/catalog";
import { SITE } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { ProductGrid } from "@/components/product/ProductGrid";
import { PageHeader } from "@/layouts/PageHeader";

export function generateStaticParams() {
  return COLLECTIONS.map((c) => ({ handle: c.handle }));
}

export async function generateMetadata(
  props: PageProps<"/collections/[handle]">,
): Promise<Metadata> {
  const { handle } = await props.params;
  const collection = getCollectionByHandle(handle);
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
          { label: "Catalog", href: "/collections/all" },
          ...(handle === "all" ? [] : [{ label: collection.title }]),
        ]}
      />
      <section className="py-14 lg:py-20">
        <Container>
          <p className="mb-8 text-xs tracking-[0.01em] text-stone">
            {products.length} {products.length === 1 ? "product" : "products"}
          </p>
          <ProductGrid products={products} columns={4} priorityCount={4} />
        </Container>
      </section>
    </>
  );
}

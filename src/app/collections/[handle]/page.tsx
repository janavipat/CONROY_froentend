import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCollectionByHandle } from "@/lib/products";
import { fetchCollection, fetchCollections } from "@/services/catalog";
import { SITE } from "@/lib/site";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { BoxIcon } from "@/components/ui/Icons";
import { ProductBrowser } from "@/components/product/ProductBrowser";
import { PageHeader } from "@/layouts/PageHeader";
import { breadcrumbSchema, itemListSchema, jsonLd, truncate } from "@/lib/seo";

/**
 * Pre-render the collections that exist, not the bundled sample.
 *
 * `COLLECTIONS` is the offline fallback and lists three legacy handles, so the
 * collections an admin has actually created had no static entry.
 */
export async function generateStaticParams() {
  const collections = await fetchCollections();
  return collections.map((c) => ({ handle: c.handle }));
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
  const socialTitle = `${title} | ${SITE.name}`;
  const description = truncate(
    collection.description || `Shop the ${title} collection from CONROY.`,
  );
  // Not every collection carries artwork; fall back to the site card rather
  // than sharing with no image, which is what declaring openGraph would cause.
  const socialImage = collection.image || `${SITE.url}/opengraph-image`;
  const images = collection.image
    ? [{ url: collection.image, width: 1200, height: 1500, alt: title }]
    : [{ url: socialImage, width: 1200, height: 630, alt: `${SITE.name} — ${title}` }];

  return {
    title,
    description,
    alternates: { canonical: `/collections/${collection.handle}` },
    openGraph: {
      type: "website",
      title: socialTitle,
      description,
      url: `${SITE.url}/collections/${collection.handle}`,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [socialImage],
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

  // Titles for the collection facet — the products carry handles.
  const labels = Object.fromEntries(
    (await fetchCollections()).map((c) => [c.handle, c.title]),
  );

  /* Breadcrumb + ItemList, matching what BrowseLayout emits for the other
     listings. This route renders PageHeader directly rather than going through
     BrowseLayout, so it needs its own graph — without it, collection pages
     were the only listings with no structured data. */
  const schema = jsonLd(
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Collection", path: "/collections/all" },
      ...(handle === "all" ? [] : [{ name: collection.title, path: null }]),
    ]),
    products.length ? itemListSchema(products, collection.title) : null,
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <PageHeader
        eyebrow={collection.subtitle}
        title={collection.title}
        description={collection.description}
        showBack
        backFallbackHref="/collections"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Collection", href: "/collections/all" },
          ...(handle === "all" ? [] : [{ label: collection.title }]),
        ]}
      />
      <section className="pb-section pt-block">
        <Container>
          {products.length === 0 ? (
            <EmptyCollection title={handle === "all" ? "" : collection.title} />
          ) : (
            <ProductBrowser products={products} collectionLabels={labels} />
          )}
        </Container>
      </section>
    </>
  );
}

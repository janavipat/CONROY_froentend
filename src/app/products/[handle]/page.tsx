import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchAllProducts, fetchProductByHandle } from "@/services/catalog";
import { SITE } from "@/lib/site";
import { breadcrumbSchema, jsonLd, productSchema, productSeoTitle, truncate } from "@/lib/seo";
import { formatCurrency } from "@/utils/format";
import { productDisplayTitle, productLabel } from "@/lib/catalog-taxonomy";
import { Container } from "@/components/ui/Container";
import { BackButton } from "@/components/ui/BackButton";
import { Rating } from "@/components/ui/Rating";
import { Accordion } from "@/components/ui/Accordion";
import { DiscountBadge } from "@/components/product/DiscountBadge";
import { ProductGallery } from "@/components/product/ProductGallery";
import { AddToCartForm } from "@/components/product/AddToCartForm";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductReviews } from "@/components/product/ProductReviews";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * Pre-render the catalogue that actually exists, not the bundled sample.
 *
 * `PRODUCTS` is the offline fallback and holds only the four original denim
 * styles, so building from it left every other product without a static entry.
 */
export async function generateStaticParams() {
  const products = await fetchAllProducts();
  return products.map((p) => ({ handle: p.handle }));
}

export async function generateMetadata(
  props: PageProps<"/products/[handle]">,
): Promise<Metadata> {
  const { handle } = await props.params;
  // Read the same source the page body does. This used to call the bundled
  // catalogue, which knows four products — so the other sixteen were served
  // "Product not found" as their title and, having no canonical of their own,
  // inherited the layout's and pointed Google at the homepage.
  const product = await fetchProductByHandle(handle);
  if (!product) {
    return { title: "Product not found", robots: { index: false, follow: true } };
  }

  const url = `${SITE.url}/products/${product.handle}`;
  const name = productSeoTitle(product.title);
  // The tagline is a single line and often shorter than a useful snippet, so
  // the description falls back to the opening of the full copy.
  const description = truncate(product.description || product.tagline);
  const socialTitle = `${name} | ${SITE.name}`;
  const images = product.images.slice(0, 2).map((img) => ({
    url: img.src,
    width: 1200,
    height: 1500,
    alt: img.alt || name,
  }));

  return {
    // Bare: the root layout's template appends "| CONROY".
    title: name,
    description,
    alternates: { canonical: `/products/${product.handle}` },
    openGraph: { type: "website", title: socialTitle, description, url, images },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: images.length ? [images[0].url] : undefined,
    },
  };
}

const SHIPPING_COPY =
  "Orders are processed within 1–2 business days and shipped via standard delivery within 6–7 business days. Expedited options are available at checkout.";

const RETURNS_COPY =
  "Returns accepted within 7 days of delivery. Items must be unused, unworn and unwashed with all original labels, tags and packaging attached. Original delivery charges are non-refundable except for faulty or incorrect items.";

export default async function ProductPage(props: PageProps<"/products/[handle]">) {
  const { handle } = await props.params;
  const product = await fetchProductByHandle(handle);
  if (!product) notFound();

  const related = (await fetchAllProducts())
    .filter((p) => p.handle !== product.handle)
    .slice(0, 4);

  /* Structured data for rich results.

     Product plus the breadcrumb the page already shows, in one graph.
     aggregateRating now comes from productSchema, which emits it only when
     the product genuinely has reviews — it was previously written on every
     product, so the sixteen with no reviews at the time were claiming a rating
     of 0 from 0 reviews. Availability reads real stock rather than always
     asserting InStock. */
  const schema = jsonLd(
    productSchema(product, productSeoTitle(product.title)),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Collection", path: "/collections/all" },
      { name: productSeoTitle(product.title), path: null },
    ]),
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <Container className="py-12 lg:py-16">
        <div className="mb-6 flex">
          <BackButton fallbackHref="/collections/all" />
        </div>

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-12 flex text-xs text-stone">
          <ol className="flex items-center gap-2.5">
            <li>
              <Link href="/" className="hover:text-ink">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/collections/all" className="hover:text-ink">
                Collection
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="text-ink">{productDisplayTitle(product)}</li>
          </ol>
        </nav>

        {/* min-w-0 on the columns: grid tracks are auto-sized, so without it a
            column can never be narrower than its content's minimum and any wide
            child widens the page instead of being contained. */}
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-24 [&>*]:min-w-0">
          <ProductGallery images={product.images} />

          <div className="min-w-0 lg:py-6">
            {/* "Denim" was hardcoded here, so it appeared above T-shirts too.
                Denim keeps its colour + category; a T-shirt shows the fabric
                collection it belongs to. */}
            <p className="eyebrow text-stone">
              {product.productType === "T-Shirt"
                ? productLabel(product)
                : `${product.color} Denim`}
            </p>
            <h1 className="display-section mt-5 text-ink">
              {productDisplayTitle(product)}
            </h1>

            {/* Wraps rather than overflowing: price, was-price, % off and the
                rating together exceed a small phone's width, and none of them
                can shrink. No effect where the row already fits. */}
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2">
              {/* Selling price first, then the struck-through original. */}
              <span className="flex items-baseline gap-3">
                <span className="text-xl text-ink">
                  {formatCurrency(product.price, product.currency)}
                </span>
                {product.compareAtPrice != null && product.compareAtPrice > product.price && (
                  <s className="text-base text-stone">
                    {formatCurrency(product.compareAtPrice, product.currency)}
                  </s>
                )}
                <DiscountBadge percent={product.discountPercent} className="text-base" />
              </span>
              <Rating value={product.rating} count={product.reviewCount} />
            </div>
            <p className="mt-2.5 text-xs text-stone">Tax included. Shipping calculated at checkout.</p>

            <p className="mt-9 text-body text-ink-soft">{product.description}</p>

            {/* Attribution and the route back up to the category. One brand
                mention, where a shopper would expect to see it — this is also
                the only link from a product page to its category, which the
                breadcrumb's generic "Collection" did not provide. */}
            <p className="mt-4 text-[0.8125rem] text-stone">
              A CONROY {product.productType === "T-Shirt" ? "T-shirt" : "denim"} —{" "}
              <Link
                href={product.productType === "T-Shirt" ? "/t-shirts" : "/denim"}
                className="text-ink underline-offset-4 hover:underline"
              >
                {product.productType === "T-Shirt"
                  ? "see all men's T-shirts"
                  : "see all men's jeans"}
              </Link>
              .
            </p>

            <div className="mt-11">
              <AddToCartForm product={product} />
            </div>

            <div className="mt-14">
              <Accordion
                items={[
                  {
                    title: "Product Details",
                    content: (
                      <ul className="space-y-3">
                        {product.details.map((d) => (
                          <li key={d} className="flex gap-2.5">
                            <span aria-hidden>—</span>
                            {d}
                          </li>
                        ))}
                      </ul>
                    ),
                  },
                  { title: "Shipping", content: SHIPPING_COPY },
                  { title: "Returns", content: RETURNS_COPY },
                ]}
              />
            </div>
          </div>
        </div>
      </Container>

      {/* Ratings & reviews (below the product details) */}
      <ProductReviews handle={product.handle} />

      {/* Related products */}
      <section className="border-t border-line py-section">
        <Container>
          <SectionHeading eyebrow="You may also like" title="Complete the look" className="mb-block" />
          <ProductGrid products={related} columns={4} />
        </Container>
      </section>
    </>
  );
}

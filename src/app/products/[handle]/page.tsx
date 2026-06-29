import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PRODUCTS, getProductByHandle } from "@/lib/products";
import { fetchAllProducts, fetchProductByHandle } from "@/services/catalog";
import { SITE } from "@/lib/site";
import { formatCurrency } from "@/utils/format";
import { Container } from "@/components/ui/Container";
import { Rating } from "@/components/ui/Rating";
import { Accordion } from "@/components/ui/Accordion";
import { ProductGallery } from "@/components/product/ProductGallery";
import { AddToCartForm } from "@/components/product/AddToCartForm";
import { ProductGrid } from "@/components/product/ProductGrid";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ handle: p.handle }));
}

export async function generateMetadata(
  props: PageProps<"/products/[handle]">,
): Promise<Metadata> {
  const { handle } = await props.params;
  const product = getProductByHandle(handle);
  if (!product) return { title: "Product not found" };

  return {
    title: product.title,
    description: product.tagline,
    alternates: { canonical: `/products/${product.handle}` },
    openGraph: {
      type: "website",
      title: `${product.title} · ${SITE.name}`,
      description: product.description,
      url: `${SITE.url}/products/${product.handle}`,
      images: product.images.slice(0, 2).map((img) => ({
        url: img.src,
        width: 1200,
        height: 1500,
        alt: img.alt,
      })),
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.title} · ${SITE.name}`,
      description: product.tagline,
      images: [product.images[0].src],
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

  // Structured data for rich results.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.images.map((i) => i.src),
    brand: { "@type": "Brand", name: SITE.name },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    },
    offers: {
      "@type": "Offer",
      priceCurrency: product.currency,
      price: product.price,
      availability: "https://schema.org/InStock",
      url: `${SITE.url}/products/${product.handle}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Container className="py-8 lg:py-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8 flex text-xs text-stone">
          <ol className="flex items-center gap-2">
            <li>
              <Link href="/" className="hover:text-ink">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/collections/all" className="hover:text-ink">
                Catalog
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="text-ink">{product.title}</li>
          </ol>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <ProductGallery images={product.images} />

          <div className="lg:py-4">
            <p className="eyebrow text-stone">{product.color} Denim</p>
            <h1 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl">
              {product.title}
            </h1>

            <div className="mt-4 flex items-center gap-4">
              <span className="text-xl text-ink">{formatCurrency(product.price, product.currency)}</span>
              <Rating value={product.rating} count={product.reviewCount} />
            </div>
            <p className="mt-1 text-xs text-stone">Tax included. Shipping calculated at checkout.</p>

            <p className="mt-6 text-[0.95rem] leading-relaxed text-ink-soft">{product.description}</p>

            <div className="mt-8">
              <AddToCartForm product={product} />
            </div>

            <div className="mt-10">
              <Accordion
                items={[
                  {
                    title: "Product Details",
                    content: (
                      <ul className="space-y-1.5">
                        {product.details.map((d) => (
                          <li key={d} className="flex gap-2">
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

      {/* Related products */}
      <section className="border-t border-line py-16 lg:py-24">
        <Container>
          <SectionHeading eyebrow="You may also like" title="Complete the look" className="mb-12" />
          <ProductGrid products={related} columns={4} />
        </Container>
      </section>
    </>
  );
}

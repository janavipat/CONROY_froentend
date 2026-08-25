import { SafeImage } from "@/components/ui/SafeImage";
import Link from "next/link";
import type { Product } from "@/types";
import { cn } from "@/utils/cn";
import { formatCurrency } from "@/utils/format";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductCard } from "@/components/product/ProductCard";

/**
 * Featured — one product photographed large beside a small grid of supporting
 * cards, rather than a heading over a thin row.
 *
 * Every image here is real catalogue photography: the feature is the first
 * image of the lead product and each card is a live product, so nothing has to
 * be invented and every tile links somewhere real. With a single product the
 * supporting grid disappears and the feature carries the band on its own.
 */
export function FeaturedEdit({
  eyebrow = "The collection",
  title = "Featured",
  description,
  products,
  href,
  ctaLabel = "View all",
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
  products: Product[];
  href: string;
  ctaLabel?: string;
}) {
  const feature = products.find((p) => p.images[0]?.src) ?? products[0];
  if (!feature) return null;

  const supporting = products.filter((p) => p.id !== feature.id).slice(0, 4);
  // With nothing beside it the feature has to keep its own proportions: an
  // `aspect-auto` column in a one-item grid row would collapse to no height.
  const hasSupporting = supporting.length > 0;

  return (
    <section className="py-section-sm">
      <Container>
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          description={description}
          className="mb-block"
        />

        <div
          className={cn(
            "grid gap-8",
            hasSupporting && "items-stretch lg:grid-cols-[1.05fr_1fr] lg:gap-10",
          )}
        >
          {/* The feature — full-bleed photography with the product named over it. */}
          <Reveal
            className={cn(
              "relative aspect-[4/5] overflow-hidden bg-mist sm:aspect-[3/2]",
              hasSupporting && "lg:aspect-auto",
            )}
          >
            <Link href={`/products/${feature.handle}`} className="group block h-full">
              {feature.images[0]?.src && (
                <SafeImage
                  src={feature.images[0].src}
                  alt={feature.images[0].alt || feature.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-(--duration-slow) ease-[var(--ease-luxe)] group-hover:scale-[1.03]"
                />
              )}
              {/* A flat caption plate rather than a gradient over the whole
                  frame: the picture stays untouched above it. */}
              <div className="absolute inset-x-0 bottom-0 bg-ink/70 p-6 sm:px-8 sm:py-7">
                <p className="eyebrow text-white/70">{feature.fit}</p>
                <h3 className="mt-3 font-display text-[1.625rem] leading-tight text-white sm:text-[2rem]">
                  {feature.title}
                </h3>
                <p className="price mt-2 text-white/85">
                  {formatCurrency(feature.price, feature.currency)}
                </p>
              </div>
            </Link>
          </Reveal>

          {/* Supporting products — the same card the listings use. */}
          {hasSupporting && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:gap-x-8">
              {supporting.map((product, i) => (
                <Reveal key={product.id} index={i % 2} as="div">
                  <ProductCard product={product} />
                </Reveal>
              ))}
            </div>
          )}
        </div>

        <div className="mt-block flex justify-center">
          <Link
            href={href}
            className="nav-label text-ink transition-colors duration-(--duration-base) hover:text-accent"
          >
            {ctaLabel}
          </Link>
        </div>
      </Container>
    </section>
  );
}

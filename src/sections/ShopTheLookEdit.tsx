import { SafeImage } from "@/components/ui/SafeImage";
import Link from "next/link";
import type { Product } from "@/types";
import { formatCurrency } from "@/utils/format";
import { productDisplayTitle } from "@/lib/catalog-taxonomy";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * Shop the Look — a large CONROY editorial photograph beside the pieces the
 * edit is built from.
 *
 * A styled look is really a curated set of products with its own image, which
 * needs a data model and admin UI that don't exist yet. Rather than ship an
 * empty band on a live storefront, this composes one edit from assets that are
 * already in the project: the brand's own denim still-life and live catalogue
 * products. Nothing is invented — the listed pieces are simply the edit's
 * category, not a fabricated outfit relationship.
 */
export function ShopTheLookEdit({
  products,
  image = "/brand/banner2.jpg",
  imageAlt = "CONROY denim — the black and indigo edit",
  lookTitle = "The Denim Edit",
  lookDescription = "Washed black and honest indigo, cut slim, straight and relaxed. Three ways to wear the same idea.",
  href,
  ctaLabel = "Shop the look",
  withHeading = true,
}: {
  products: Product[];
  image?: string;
  imageAlt?: string;
  lookTitle?: string;
  lookDescription?: string;
  href: string;
  ctaLabel?: string;
  withHeading?: boolean;
}) {
  const pieces = products.filter((p) => p.images[0]?.src).slice(0, 3);

  return (
    <section className="py-section-sm">
      <Container>
        {withHeading && (
          <SectionHeading
            eyebrow="Styled by CONROY"
            title="Shop the Look"
            className="mb-block"
          />
        )}

        <div className="grid items-center gap-10 lg:grid-cols-[1.35fr_1fr] lg:gap-16">
          {/* The look. It keeps a portrait crop rather than stretching to the
              column beside it, so the band's height comes from the photograph
              and not from however many pieces the edit happens to list. */}
          <Reveal className="relative aspect-[4/5] overflow-hidden bg-mist sm:aspect-[3/2] lg:aspect-[4/5]">
            <Link href={href} className="group block h-full" aria-label={lookTitle}>
              <SafeImage
                src={image}
                alt={imageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover transition-transform duration-(--duration-slow) ease-[var(--ease-luxe)] group-hover:scale-[1.03]"
              />
              {/* Flat caption plate, same as the Featured band — no gradient. */}
              <div className="absolute inset-x-0 bottom-0 bg-ink/70 p-6 sm:px-8 sm:py-7">
                <p className="eyebrow text-white/70">The edit</p>
                <h3 className="mt-3 font-display text-[1.625rem] leading-tight text-white sm:text-[2.125rem]">
                  {lookTitle}
                </h3>
              </div>
            </Link>
          </Reveal>

          {/* The pieces in the edit */}
          <Reveal index={1} className="flex flex-col justify-center">
            <p className="eyebrow">In this edit</p>
            <p className="mt-5 text-body text-ink-soft">{lookDescription}</p>

            {pieces.length > 0 && (
              <ul className="mt-9 divide-y divide-line border-y border-line">
                {pieces.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/products/${p.handle}`}
                      className="group flex items-center gap-5 py-4"
                    >
                      <span className="relative h-20 w-16 shrink-0 overflow-hidden bg-mist">
                        <SafeImage
                          src={p.images[0].src}
                          alt={p.images[0].alt || p.title}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="display-product block truncate text-ink transition-colors duration-(--duration-quick) group-hover:text-accent">
                          {productDisplayTitle(p)}
                        </span>
                        <span className="price mt-1 block text-stone">
                          {formatCurrency(p.price, p.currency)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <Link
              href={href}
              className="nav-label mt-9 inline-block w-fit text-ink transition-colors duration-(--duration-base) hover:text-accent"
            >
              {ctaLabel}
            </Link>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

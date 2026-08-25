"use client";

import { SafeImage } from "@/components/ui/SafeImage";
import Link from "next/link";
import { PRODUCT_TYPE_NAV } from "@/lib/site";

/**
 * A photograph for a product type, keyed by the catalogue's `productType`
 * field. Filled from the live catalogue by the header.
 */
export type ProductTypeImages = Record<string, { src: string; alt: string } | undefined>;

/**
 * Shown when the catalogue can't be reached. An existing CONROY still-life
 * from the project's own brand assets — never a stock or generated image — so
 * the menu is visual even if the products endpoint is down.
 */
const FALLBACK_JEANS = { src: "/brand/banner1.png", alt: "CONROY denim" };

/**
 * The Collections menu: what CONROY makes, one entry per product type, beside
 * a photograph.
 *
 * It used to list the merchandising collections an admin had created — "Romano
 * Fit · Bleu Heritage", "Vintage Collection" — which is internal merchandising
 * vocabulary, not how a shopper thinks about a Collections menu. Those
 * collections are untouched and still live at /collections/[handle].
 *
 * The picture is the first image of a real product of that type, so it is
 * always current catalogue photography and never has to be maintained by hand.
 * Only types that actually have a photograph get one — a type with no products
 * yet (T-Shirts, today) stays in the list as a link rather than becoming an
 * empty grey box.
 */
export function CollectionsMenu({
  images,
  onNavigate,
}: {
  images: ProductTypeImages;
  onNavigate?: () => void;
}) {
  // The lead image: the first listed type that has a photograph, falling back
  // to the brand still-life.
  const lead =
    PRODUCT_TYPE_NAV.map((t) => ({ type: t, image: images[t.productType] })).find(
      (entry) => entry.image,
    ) ?? { type: PRODUCT_TYPE_NAV[0], image: FALLBACK_JEANS };

  const image = lead.image ?? FALLBACK_JEANS;

  return (
    <div className="w-max border border-line bg-white p-7 shadow-(--shadow-lift)">
      <p className="eyebrow border-b border-line pb-4 text-stone">Collections</p>

      <div className="mt-6 flex items-stretch gap-8">
        <Link
          href={lead.type.href}
          onClick={onNavigate}
          className="group relative block h-52 w-40 shrink-0 overflow-hidden bg-mist"
          aria-label={lead.type.label}
        >
          <SafeImage
            src={image.src}
            alt={image.alt}
            fill
            sizes="160px"
            // Eager, not lazy: the panel only mounts once the visitor hovers,
            // so waiting on an intersection callback would show an empty frame
            // for the first moment of every open.
            loading="eager"
            className="object-cover transition-transform duration-(--duration-slow) ease-[var(--ease-luxe)] group-hover:scale-[1.04]"
          />
        </Link>

        <ul className="flex flex-col justify-center gap-5 pr-4">
          {PRODUCT_TYPE_NAV.map((type) => (
            <li key={type.href}>
              <Link
                href={type.href}
                onClick={onNavigate}
                className="nav-label whitespace-nowrap text-ink transition-colors duration-(--duration-base) hover:text-accent"
              >
                {type.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

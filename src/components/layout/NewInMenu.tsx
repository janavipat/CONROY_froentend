"use client";

import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/utils/format";

/** The slice of a product the menu needs — kept narrow so the header's fetch stays cheap. */
export interface NewInItem {
  handle: string;
  title: string;
  image?: string;
  price: number;
  currency: string;
}

/**
 * How many products the panel shows. New In is a discovery surface, not the
 * listing — anything beyond this is one click away behind "View all new in".
 * Four also keeps the panel inside the viewport: it hangs from the New In link,
 * roughly a third of the way across the header, so a wider panel would run off
 * the right edge at the 1280px breakpoint where the desktop nav appears.
 */
export const NEW_IN_MENU_LIMIT = 4;

/**
 * "View all new in" — a small outlined control rather than a line of text, so
 * it reads as the panel's action. Borrows the house button's 4px corner,
 * uppercase tracking and 350ms transition at a size that suits a dropdown.
 */
const VIEW_ALL =
  "nav-label inline-flex h-9 items-center rounded-(--radius-button) border border-ink/25 px-4 text-ink " +
  "transition-[background-color,border-color,color] duration-(--duration-button) ease-out " +
  "hover:border-ink hover:bg-ink hover:text-white " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/**
 * The New In dropdown: a row of the products an admin has marked New In, in
 * `newInOrder`. Replaces the always-visible homepage rail, which stood empty
 * (or one-product-wide) whenever nothing was curated.
 *
 * The panel is sized by its contents — one product gives a narrow card, five
 * give a full mega-menu — so an under-filled New In never reads as a gap. With
 * nothing curated at all it falls back to a compact invitation rather than an
 * empty grid.
 */
export function NewInMenu({
  products,
  onNavigate,
}: {
  products: NewInItem[];
  onNavigate?: () => void;
}) {
  if (products.length === 0) {
    return (
      <div className="w-[21rem] border border-line bg-white p-7 shadow-(--shadow-lift)">
        <p className="eyebrow text-stone">New In</p>
        <p className="mt-3.5 max-w-[26ch] text-[0.9375rem] leading-[1.7] text-ink-soft">
          Explore our latest collection — the newest CONROY pieces, as they land.
        </p>
        <Link href="/new-in" onClick={onNavigate} className={`${VIEW_ALL} mt-6`}>
          View all new in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-max max-w-[min(90vw,56rem)] border border-line bg-white p-8 shadow-(--shadow-lift)">
      <div className="flex items-center justify-between gap-12 border-b border-line pb-4">
        <p className="eyebrow text-stone">New In</p>
        <Link href="/new-in" onClick={onNavigate} className={VIEW_ALL}>
          View all new in
        </Link>
      </div>

      <ul className="mt-7 flex flex-wrap gap-x-7 gap-y-9">
        {products.slice(0, NEW_IN_MENU_LIMIT).map((p) => (
          <li key={p.handle} className="w-44">
            <Link
              href={`/products/${p.handle}`}
              onClick={onNavigate}
              className="group block"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-mist">
                {p.image && (
                  <Image
                    src={p.image}
                    alt={p.title}
                    fill
                    sizes="184px"
                    className="object-cover transition-transform duration-(--duration-slow) ease-[var(--ease-luxe)] group-hover:scale-[1.04]"
                  />
                )}
              </div>
              <p className="display-product mt-4 text-ink transition-colors duration-(--duration-quick) group-hover:text-accent">
                {p.title}
              </p>
              <p className="price mt-1.5 text-stone">
                {formatCurrency(p.price, p.currency)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

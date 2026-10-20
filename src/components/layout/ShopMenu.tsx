"use client";

import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { Container } from "@/components/ui/Container";
import type { NavGroup } from "@/lib/site";

/** One photograph per Shop column, keyed by the column's href. */
export type ShopImages = Record<string, { src: string; alt: string } | undefined>;

/**
 * The Shop mega-menu: one column per category — heading, photograph, links —
 * separated by hairlines.
 *
 * It spans the header's full width and sits flush under the navigation row on
 * the header's own ivory ground, so it reads as part of the header rather than
 * a floating card. No shadow and no page overlay: the page stays visible
 * below it.
 */
export function ShopMenu({
  id,
  groups,
  images,
  onNavigate,
}: {
  id: string;
  groups: NavGroup[];
  images: ShopImages;
  onNavigate: () => void;
}) {
  return (
    <div id={id} className="border-t border-line bg-ivory">
      <Container className="py-8">
        {/* Equal padding on every column keeps the three images the same size;
            the outer columns' extra padding is absorbed by -mx. */}
        <div className="mx-auto max-w-4xl">
          <div className="-mx-9 grid grid-cols-3 divide-x divide-line">
            {groups.map((group) => {
              const image = images[group.href];
              return (
                <div key={group.href + group.label} className="px-9">
                  <Link
                    href={group.href}
                    onClick={onNavigate}
                    className="nav-label text-ink transition-colors duration-(--duration-base) hover:text-accent"
                  >
                    {group.label}
                  </Link>

                  {/* The photograph repeats the heading's link, so it is
                      skipped by keyboard and screen readers. */}
                  <Link
                    href={group.href}
                    onClick={onNavigate}
                    tabIndex={-1}
                    aria-hidden
                    className="group mt-5 block"
                  >
                    <span className="relative block aspect-[4/5] w-full overflow-hidden bg-mist">
                      {image && (
                        <SafeImage
                          src={image.src}
                          alt=""
                          fill
                          sizes="(min-width: 1280px) 220px, 25vw"
                          // Eager: the panel only mounts on open, so lazy
                          // loading would show an empty frame at first.
                          loading="eager"
                          className="object-cover object-center transition-transform duration-(--duration-slow) ease-[var(--ease-luxe)] group-hover:scale-[1.03]"
                        />
                      )}
                    </span>
                  </Link>

                  <ul className="mt-5 space-y-2.5">
                    {group.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          onClick={onNavigate}
                          className="text-[0.8125rem] text-ink-soft transition-colors duration-(--duration-quick) hover:text-ink"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";

const CDN = "https://cdn.shopify.com/s/files/1/0763/6248/1899/files";

interface Tile {
  badge: string;
  title: string;
  href: string;
  image: string;
}

const TILES: Tile[] = [
  {
    badge: "Bestseller",
    title: "Noir Classique",
    href: "/collections/romano-fit-noir-classique",
    image: `${CDN}/3_3_jpg.jpg?v=1771951023`,
  },
  {
    badge: "New in",
    title: "Bleu Heritage",
    href: "/collections/romano-fit-bleu-heritage",
    image: `${CDN}/4_1_jpg.jpg?v=1771951309`,
  },
  {
    badge: "Trending",
    title: "Relax Fit",
    href: "/collections/romano-fit-noir-classique",
    image: `${CDN}/1.1.jpg_2_f47254ce-4b73-4cfe-87d8-4fbf77e25ccd.jpg?v=1773538477`,
  },
  {
    badge: "Shop all",
    title: "All Denim",
    href: "/collections/all",
    image: `${CDN}/2_7_jpg.jpg?v=1771950828`,
  },
];

/** Shop-by-category tiles — portrait cards with a badge, centered title and CTA. */
export function CollectionShowcase() {
  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <Container>
        <div className="mb-7 flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl leading-tight text-ink sm:text-3xl lg:text-4xl">
            Shop by category
          </h2>
          <Link
            href="/collections/all"
            className="shrink-0 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-ink-soft underline-offset-4 hover:text-ink hover:underline"
          >
            View all
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {TILES.map((t, i) => (
            <Reveal key={t.title} index={i} as="article">
              <Link
                href={t.href}
                className="group relative block overflow-hidden rounded-media bg-mist"
              >
                <div className="relative aspect-[3/4]">
                  <Image
                    src={t.image}
                    alt={t.title}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-[1200ms] ease-[var(--ease-luxe)] group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-ink/25 via-transparent to-ink/45" />
                </div>

                {/* Category badge */}
                <span className="absolute left-3 top-3 rounded-[4px] bg-white/95 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-ink sm:left-4 sm:top-4 sm:text-[0.65rem]">
                  {t.badge}
                </span>

                {/* Centered title + CTA */}
                <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-col items-center px-3 text-center">
                  <h3 className="max-w-[90%] text-balance text-lg font-extrabold uppercase leading-[1.05] tracking-wide text-[#ffd60a] drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)] sm:text-2xl lg:text-[1.6rem]">
                    {t.title}
                  </h3>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

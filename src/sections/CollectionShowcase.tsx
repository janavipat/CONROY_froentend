import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { ArrowRightIcon } from "@/components/ui/Icons";

interface Showcase {
  eyebrow: string;
  title: string;
  copy: string;
  href: string;
  image: string;
}

const SHOWCASES: Showcase[] = [
  {
    eyebrow: "Limited time only",
    title: "Straight Fit",
    copy: "A clean, tailored line in washed black and heritage indigo.",
    href: "/collections/romano-fit-noir-classique",
    image: "/brand/banner2.jpg",
  },
  {
    eyebrow: "Limited time only",
    title: "Relax Fit",
    copy: "Easy, breathable denim with room to move and quiet confidence.",
    href: "/collections/romano-fit-bleu-heritage",
    image: "/brand/banner1.png",
  },
];

/** Two split editorial banners — mirrors the homepage Straight/Relax features. */
export function CollectionShowcase() {
  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <Container>
        <div className="grid gap-6 md:grid-cols-2">
          {SHOWCASES.map((s, i) => (
            <Reveal key={s.title} index={i} as="article">
              <Link
                href={s.href}
                className="group relative block overflow-hidden rounded-media bg-mist"
              >
                <div className="relative aspect-[4/5] sm:aspect-[3/4]">
                  <Image
                    src={s.image}
                    alt={s.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-[1200ms] ease-[var(--ease-luxe)] group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/10 to-transparent" />
                </div>
                <div className="absolute inset-x-0 bottom-0 p-7 sm:p-9">
                  <p className="eyebrow text-cream/80">{s.eyebrow}</p>
                  <h3 className="mt-2 font-display text-3xl text-cream sm:text-4xl">{s.title}</h3>
                  <p className="mt-2 max-w-xs text-sm text-cream/85">{s.copy}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-[0.72rem] uppercase tracking-[0.18em] text-cream">
                    Shop now
                    <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

import Image from "next/image";
import { SITE } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import { InstagramIcon } from "@/components/ui/Icons";

// Real @conroy.official feed imagery captured from the live storefront.
const TILES = [
  { src: "/brand/ig1.png", alt: "CONROY denim styling" },
  { src: "/brand/ig2.jpg", alt: "CONROY denim styling" },
  { src: "/brand/ig3.jpg", alt: "CONROY denim styling" },
  { src: "/brand/ig4.jpg", alt: "CONROY denim styling" },
  { src: "/brand/ig5.jpg", alt: "CONROY denim styling" },
  { src: "/brand/banner3.jpg", alt: "CONROY denim styling" },
];

export function InstagramFeed() {
  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <Container>
        <SectionHeading
          eyebrow="Follow along"
          title={SITE.social.instagramHandle}
          description="Styling notes, new drops and life in CONROY denim."
          className="mb-12"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {TILES.map((tile, i) => (
            <Reveal key={i} index={i % 6} as="div">
              <a
                href={SITE.social.instagram}
                target="_blank"
                rel="noreferrer"
                className="group relative block aspect-square overflow-hidden bg-mist"
                aria-label="View on Instagram"
              >
                <Image
                  src={tile.src}
                  alt={tile.alt}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  className="object-cover transition-transform duration-700 ease-[var(--ease-luxe)] group-hover:scale-110"
                />
                <span className="absolute inset-0 grid place-items-center bg-ink/0 transition-colors duration-300 group-hover:bg-ink/40">
                  <InstagramIcon className="h-7 w-7 text-cream opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

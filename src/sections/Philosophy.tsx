import Image from "next/image";
import { PRODUCTS } from "@/lib/products";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";

const VALUES = [
  "Honest materials, crafted with integrity",
  "Enduring silhouettes, refined through time",
  "Functional elegance for everyday living",
  "Thoughtful craftsmanship honouring tradition",
];

export function Philosophy() {
  return (
    <section className="bg-paper py-16 sm:py-20 lg:py-28">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal className="relative aspect-[4/5] overflow-hidden bg-mist">
            <Image
              src={PRODUCTS[2].images[0].src}
              alt="CONROY craftsmanship"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </Reveal>

          <div>
            <Reveal>
              <p className="eyebrow text-stone">Our Philosophy</p>
              <h2 className="mt-4 font-display text-3xl leading-tight text-ink sm:text-4xl lg:text-[2.75rem]">
                Style that whispers, rather than shouts.
              </h2>
              <p className="mt-6 text-base leading-relaxed text-ink-soft">
                True luxury is neither loud nor fleeting — it is quietly confident,
                meticulously crafted and built to endure. Every fabric is chosen for its
                integrity; every detail shaped by artisans who understand that excellence is
                not an act, but a long-standing tradition.
              </p>
            </Reveal>

            <ul className="mt-8 space-y-3">
              {VALUES.map((value, i) => (
                <Reveal key={value} index={i} as="li" className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
                  <span className="text-[0.95rem] text-ink-soft">{value}</span>
                </Reveal>
              ))}
            </ul>

            <Reveal className="mt-9">
              <Button href="/about" variant="outline">
                Read our story
              </Button>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import { PRODUCTS } from "@/lib/products";
import { SITE } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/layouts/PageHeader";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "About us",
  description:
    "CONROY stands for old-world elegance — restraint over extravagance, quality over quantity, craftsmanship over trend. Discover our story.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: `About us · ${SITE.name}`,
    description:
      "Old-world elegance — quality over quantity, craftsmanship over trend. The CONROY story.",
    url: `${SITE.url}/about`,
  },
};

const PILLARS = [
  {
    title: "Honest Materials",
    body: "Every fabric is chosen for its integrity — premium denim selected to soften, age and endure beautifully.",
  },
  {
    title: "Enduring Silhouettes",
    body: "Designs refined through time rather than chased through trend. Lines that remain relevant season after season.",
  },
  {
    title: "Functional Elegance",
    body: "Clothing meant to be lived in, passed down and appreciated — not for a season, but for a lifetime.",
  },
  {
    title: "Thoughtful Craft",
    body: "Shaped by artisans who understand that excellence is not an act, but a long-standing tradition.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="Our Story"
        title="About CONROY"
        description="True luxury is neither loud nor fleeting — it is quietly confident, meticulously crafted, and built to endure."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "About us" }]}
      />

      {/* Intro split */}
      <section className="py-section">
        <Container>
          <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-24">
            <Reveal className="relative aspect-[4/5] overflow-hidden bg-mist">
              <Image
                src={PRODUCTS[1].images[0].src}
                alt="CONROY denim craftsmanship"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </Reveal>
            <div>
              <Reveal>
                <p className="eyebrow text-stone">Old-world elegance</p>
                <h2 className="display-section mt-6 text-ink">
                  Garments designed with intention.
                </h2>
              </Reveal>
              <div className="mt-8 space-y-6 text-body text-ink-soft">
                <Reveal as="div">
                  <p>
                    We believe in restraint over extravagance, quality over quantity, and
                    craftsmanship over trend. Our garments are designed with intention — every
                    fabric chosen for its integrity, every detail shaped by artisans.
                  </p>
                </Reveal>
                <Reveal as="div" index={1}>
                  <p>
                    In a world of rapid change, we stand for the enduring. For heritage refined,
                    simplicity elevated, and style that whispers rather than shouts.
                  </p>
                </Reveal>
              </div>
              <Reveal className="mt-12">
                <Button href="/collections/all">Explore the collection</Button>
              </Reveal>
            </div>
          </div>
        </Container>
      </section>

      {/* Pillars */}
      <section className="bg-paper py-section">
        <Container>
          <SectionHeading
            eyebrow="What we stand for"
            title="Four enduring commitments"
            className="mb-block"
          />
          <div className="grid gap-px overflow-hidden bg-line sm:grid-cols-2">
            {PILLARS.map((pillar, i) => (
              <Reveal key={pillar.title} index={i % 2} className="bg-paper p-10 lg:p-14">
                <span className="font-display text-3xl text-stone">0{i + 1}</span>
                <h3 className="mt-6 font-display text-xl text-ink">{pillar.title}</h3>
                <p className="mt-4 text-body text-ink-soft">{pillar.body}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Quote band */}
      <section className="bg-sage py-section">
        <Container>
          <Reveal className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <span aria-hidden className="font-display text-6xl leading-none text-accent/30 sm:text-7xl">
              &ldquo;
            </span>
            <blockquote className="-mt-3 font-display text-[1.7rem] leading-[1.4] text-ink sm:text-3xl lg:text-[2.4rem] lg:leading-[1.35]">
              Clothing meant to be lived in, passed down, and appreciated — not for a
              season, but for a lifetime.
            </blockquote>
            <div className="mt-12 flex items-center gap-5">
              <span className="h-px w-10 bg-ink/20" />
              <span className="eyebrow">The CONROY promise</span>
              <span className="h-px w-10 bg-ink/20" />
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}

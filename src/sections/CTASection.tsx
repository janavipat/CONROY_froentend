import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";

/** Closing promise band — "original, authentic pieces that are made to last". */
export function CTASection() {
  return (
    <section className="bg-sky py-20 lg:py-28">
      <Container>
        <Reveal className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <p className="eyebrow text-stone">Our Promise</p>
          <h2 className="mt-4 font-display text-3xl leading-tight text-ink sm:text-4xl lg:text-5xl">
            Original, authentic pieces — made to last.
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-soft">
            We only carry designs we believe in, ethically and aesthetically. For heritage
            refined, simplicity elevated, and style that endures beyond the season.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Button href="/collections/all" size="lg">
              Shop the collection
            </Button>
            <Button href="/contact" variant="ghost" size="lg">
              Get in touch
            </Button>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

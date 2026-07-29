import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";

/** Closing promise band — "original, authentic pieces that are made to last". */
export function CTASection() {
  return (
    <section className="bg-sky py-section">
      <Container>
        <Reveal className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <p className="eyebrow text-stone">Our Promise</p>
          <h2 className="display-section mt-6 text-ink">
            Original, authentic pieces — made to last.
          </h2>
          <p className="mt-8 max-w-xl text-body text-ink-soft">
            We only carry designs we believe in, ethically and aesthetically. For heritage
            refined, simplicity elevated, and style that endures beyond the season.
          </p>
          <div className="mt-12 flex flex-wrap justify-center gap-5">
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

import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";

/**
 * A short statement of what CONROY is, in prose.
 *
 * The homepage previously never said the brand name in its visible copy — the
 * hero reads "Soft Comfort / Bold Looks", the rest are section labels, and
 * CONROY appeared only in the title tag and image alt text. A search engine
 * reading the page had nothing connecting the word to denim, to menswear or to
 * India, which is most of what a branded search needs to resolve.
 *
 * Everything here is drawn from what the store already states elsewhere: the
 * catalogue itself, and the Ahmedabad address and Indian jurisdiction on the
 * Terms page. No provenance, heritage or manufacturing claim is made beyond
 * what the site already publishes.
 *
 * Deliberately one paragraph. It exists because a shopper landing cold should
 * be told what this shop is, not to reach a word count.
 */
export function BrandIntro() {
  return (
    <section className="border-b border-line py-section-sm" aria-labelledby="brand-intro-title">
      <Container className="max-w-3xl text-center">
        <Reveal>
          <p className="eyebrow text-stone">The label</p>
          <h2 id="brand-intro-title" className="display-section mt-5 text-ink">
            Premium denim, made for the everyday
          </h2>
          <p className="measure mx-auto mt-7 text-body text-ink-soft">
            CONROY is an Indian menswear label based in Ahmedabad, making premium denim and
            everyday essentials for men — jeans in slim, straight and relaxed fits, and cotton
            and cotton-lycra T-shirts. Each piece is cut for comfort that holds its shape, in
            colours and washes meant to be worn for years rather than a season.
          </p>
          {/* The four routes a shopper is most likely to want next, and the
              four Google should see the homepage endorsing. */}
          <nav aria-label="Shop by category" className="mt-9 flex flex-wrap justify-center gap-x-7 gap-y-3">
            {[
              { label: "Men's jeans", href: "/denim" },
              { label: "Men's T-shirts", href: "/t-shirts" },
              { label: "New arrivals", href: "/new-in" },
              { label: "All collections", href: "/collections" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-[0.8125rem] text-ink underline-offset-4 transition-colors duration-(--duration-quick) hover:text-accent hover:underline"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </Reveal>
      </Container>
    </section>
  );
}

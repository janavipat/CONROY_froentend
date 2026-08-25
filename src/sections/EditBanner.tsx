import { SafeImage } from "@/components/ui/SafeImage";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * An editorial band that sends shoppers into a category — the Denim Edit and
 * the T-Shirt Edit.
 *
 * Given an `image` it becomes a split editorial: photograph on one side, copy
 * on the other. Without one it collapses to a compact centred band, so a band
 * carrying nothing but a heading and a link never reserves a screen's worth of
 * height.
 *
 * `tone` rather than a className: `cn` is plain clsx, so a caller passing
 * `bg-background` could not reliably beat a hard-coded `bg-paper`.
 */
export function EditBanner({
  eyebrow,
  title,
  description,
  href,
  ctaLabel,
  image,
  imageAlt = "",
  imageSide = "left",
  tone = "paper",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href: string;
  ctaLabel: string;
  /** Existing CONROY photography. Omitted, the band renders as text only. */
  image?: string;
  imageAlt?: string;
  imageSide?: "left" | "right";
  tone?: "paper" | "page";
}) {
  // The house button rather than a bare text link: this is the band's only
  // action, and as `nav-label` text it read as a caption beside the copy.
  // Button renders a next/link when given href, so navigation is unchanged.
  const cta = (
    <Button href={href} size="lg">
      {ctaLabel}
    </Button>
  );

  const band = tone === "paper" ? "bg-paper" : "bg-background";

  if (!image) {
    return (
      <section className={cn(band, "py-section-sm")}>
        <Container>
          <SectionHeading eyebrow={eyebrow} title={title} description={description} />
          <div className="mt-block flex justify-center">{cta}</div>
        </Container>
      </section>
    );
  }

  return (
    <section className={cn(band, "py-section-sm")}>
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
          <Reveal
            className={cn(
              "relative aspect-[4/5] overflow-hidden bg-mist sm:aspect-[3/2] lg:aspect-[4/5]",
              imageSide === "right" && "lg:order-last",
            )}
          >
            <SafeImage
              src={image}
              alt={imageAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
            />
          </Reveal>

          <div>
            <SectionHeading
              align="left"
              eyebrow={eyebrow}
              title={title}
              description={description}
            />
            <Reveal index={1}>
              <div className="mt-10">{cta}</div>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}

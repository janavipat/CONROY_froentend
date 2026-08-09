import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * An editorial band that sends shoppers into a category — the Denim Edit and
 * the T-Shirt Edit. Structure only; Phase 3 gives it its imagery and layout.
 */
export function EditBanner({
  eyebrow,
  title,
  description,
  href,
  ctaLabel,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href: string;
  ctaLabel: string;
  className?: string;
}) {
  return (
    <section className={className ?? "bg-paper py-section"}>
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} description={description} />
        <div className="mt-block flex justify-center">
          <Link href={href} className="nav-label text-ink-soft transition-colors hover:text-ink">
            {ctaLabel}
          </Link>
        </div>
      </Container>
    </section>
  );
}

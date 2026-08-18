import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { BackButton } from "@/components/ui/BackButton";

interface Crumb {
  label: string;
  href?: string;
}

/**
 * Editorial page banner with breadcrumb, used across content & shop pages.
 *
 * Compact by design: on the `--spacing-section-sm` scale this band ran to
 * 120px of padding above and below three short lines of type, which pushed the
 * first row of products off the screen. The content is unchanged — only the
 * air around it.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumbs,
  showBack = false,
  backFallbackHref,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbs?: Crumb[];
  /** Opt-in: only pages a shopper drills into carry a back control. */
  showBack?: boolean;
  backFallbackHref?: string;
}) {
  return (
    <header className="border-b border-line bg-paper">
      <Container className="py-8 text-center sm:py-10 lg:py-12">
        {showBack && (
          <div className="mb-5 flex justify-start text-left">
            <BackButton fallbackHref={backFallbackHref} />
          </div>
        )}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-4 flex justify-center">
            <ol className="flex items-center gap-2.5 text-[0.6875rem] uppercase tracking-[0.14em] text-stone">
              {breadcrumbs.map((crumb, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="transition-colors duration-(--duration-quick) hover:text-accent"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-ink">{crumb.label}</span>
                  )}
                  {i < breadcrumbs.length - 1 && <span aria-hidden>/</span>}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <Reveal className="flex flex-col items-center gap-3.5">
          {eyebrow && <span className="eyebrow text-stone">{eyebrow}</span>}
          <h1 className="display-section text-ink">{title}</h1>
          {description && <p className="measure text-body text-ink-soft">{description}</p>}
        </Reveal>
      </Container>
    </header>
  );
}

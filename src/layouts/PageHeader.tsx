import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";

interface Crumb {
  label: string;
  href?: string;
}

/** Editorial page banner with breadcrumb, used across content & shop pages. */
export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumbs,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbs?: Crumb[];
}) {
  return (
    <header className="border-b border-line bg-paper">
      <Container className="py-section-sm text-center">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-8 flex justify-center">
            <ol className="flex items-center gap-2.5 text-xs text-stone">
              {breadcrumbs.map((crumb, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-ink">
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
        <Reveal className="flex flex-col items-center gap-5 sm:gap-6">
          {eyebrow && <span className="eyebrow text-stone">{eyebrow}</span>}
          <h1 className="display-section text-ink">{title}</h1>
          {description && <p className="measure text-body text-ink-soft">{description}</p>}
        </Reveal>
      </Container>
    </header>
  );
}

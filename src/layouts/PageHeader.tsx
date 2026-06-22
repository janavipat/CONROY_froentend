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
      <Container className="py-14 text-center sm:py-16 lg:py-20">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-6 flex justify-center">
            <ol className="flex items-center gap-2 text-xs text-stone">
              {breadcrumbs.map((crumb, i) => (
                <li key={i} className="flex items-center gap-2">
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
        <Reveal className="flex flex-col items-center gap-4">
          {eyebrow && <span className="eyebrow text-stone">{eyebrow}</span>}
          <h1 className="font-display text-4xl leading-tight text-ink sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          {description && (
            <p className="max-w-2xl text-[0.95rem] leading-relaxed text-ink-soft">{description}</p>
          )}
        </Reveal>
      </Container>
    </header>
  );
}

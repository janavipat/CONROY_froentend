import Link from "next/link";
import { FOOTER_NAV, SITE } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { ClockIcon, InstagramIcon, MailIcon, PhoneIcon } from "@/components/ui/Icons";
import { NewsletterForm } from "./NewsletterForm";

export function Footer() {
  const year = 2026;
  return (
    <footer className="border-t border-line bg-paper">
      <Container className="py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          {/* Brand + newsletter */}
          <div className="max-w-sm">
            <Link href="/" className="font-display text-3xl tracking-[0.3em] text-ink">
              {SITE.name}
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">{SITE.description}</p>
            <p className="mt-6 eyebrow text-stone">Join the list</p>
            <p className="mb-3 mt-1 text-sm text-ink-soft">
              Early access to new drops and quiet stories from the studio.
            </p>
            <NewsletterForm />
          </div>

          {/* Link columns */}
          <div className="grid gap-10 sm:grid-cols-3">
            {FOOTER_NAV.map((col) => (
              <div key={col.title}>
                <h3 className="eyebrow text-ink">{col.title}</h3>
                <ul className="mt-4 space-y-3">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-ink-soft transition-colors hover:text-ink"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Contact strip */}
        <div className="mt-14 grid gap-4 border-t border-line pt-8 text-sm text-ink-soft sm:grid-cols-3">
          <a href={SITE.contact.phoneHref} className="flex items-center gap-2 hover:text-ink">
            <PhoneIcon className="h-4 w-4" /> {SITE.contact.phone}
          </a>
          <a href={`mailto:${SITE.contact.email}`} className="flex items-center gap-2 hover:text-ink">
            <MailIcon className="h-4 w-4" /> {SITE.contact.email}
          </a>
          <span className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4" /> {SITE.contact.hours}
          </span>
        </div>
      </Container>

      {/* Bottom bar */}
      <div className="border-t border-line">
        <Container className="flex flex-col items-center justify-between gap-3 py-6 sm:flex-row">
          <p className="text-xs text-stone">
            © {year} {SITE.legalName}. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <Link href="/policy" className="text-xs text-stone hover:text-ink">
              Store Policy
            </Link>
            <Link href="/terms" className="text-xs text-stone hover:text-ink">
              Terms &amp; Conditions
            </Link>
            <a
              href={SITE.social.instagram}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="text-ink transition-colors hover:text-stone"
            >
              <InstagramIcon className="h-5 w-5" />
            </a>
          </div>
        </Container>
      </div>
    </footer>
  );
}

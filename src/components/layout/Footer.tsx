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
        <div className="mt-14 grid gap-3 border-t border-line pt-10 sm:grid-cols-3">
          {[
            { Icon: PhoneIcon, label: "Call us", value: SITE.contact.phone, href: SITE.contact.phoneHref },
            { Icon: MailIcon, label: "Email", value: SITE.contact.email, href: `mailto:${SITE.contact.email}` },
            { Icon: ClockIcon, label: "Hours", value: SITE.contact.hours },
          ].map(({ Icon, label, value, href }) => {
            const inner = (
              <>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line bg-white text-ink transition-colors group-hover:border-ink">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[0.65rem] uppercase tracking-wide text-stone">{label}</span>
                  <span className="block truncate text-sm text-ink">{value}</span>
                </span>
              </>
            );
            return href ? (
              <a key={label} href={href} className="group flex items-center gap-3">
                {inner}
              </a>
            ) : (
              <div key={label} className="flex items-center gap-3">
                {inner}
              </div>
            );
          })}
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
              className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink transition-colors hover:border-ink hover:bg-ink hover:text-white"
            >
              <InstagramIcon className="h-4.5 w-4.5" />
            </a>
          </div>
        </Container>
      </div>
    </footer>
  );
}

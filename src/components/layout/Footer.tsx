import Link from "next/link";
import { FOOTER_NAV, SITE } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { ClockIcon, InstagramIcon, MailIcon, PhoneIcon } from "@/components/ui/Icons";
import { NewsletterForm } from "./NewsletterForm";

export function Footer() {
  const year = 2026;
  return (
    <footer className="border-t border-line bg-background">
      <Container className="py-section">
        <div className="grid gap-16 lg:grid-cols-[1.4fr_2fr] lg:gap-24">
          {/* Brand + newsletter */}
          <div className="max-w-sm">
            <Link href="/" className="font-display text-[2.25rem] tracking-[0.32em] text-ink">
              {SITE.name}
            </Link>
            <p className="mt-8 max-w-xs text-[0.9375rem] leading-[1.9] text-ink-soft">{SITE.description}</p>
            <p className="eyebrow mt-14">Join the list</p>
            <p className="mb-7 mt-4 text-[0.9375rem] leading-[1.9] text-ink-soft">
              Early access to new drops and quiet stories from the studio.
            </p>
            <NewsletterForm />
          </div>

          {/* Link columns */}
          <div className="grid gap-12 sm:grid-cols-3 lg:gap-16">
            {FOOTER_NAV.map((col) => (
              <div key={col.title}>
                <h3 className="eyebrow text-ink">{col.title}</h3>
                <ul className="mt-8 space-y-5">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-[0.9375rem] text-ink-soft transition-colors duration-500 hover:text-accent"
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
        <div className="mt-24 grid gap-10 border-t border-line pt-16 sm:grid-cols-3 sm:gap-12">
          {[
            { Icon: PhoneIcon, label: "Call us", value: SITE.contact.phone, href: SITE.contact.phoneHref },
            { Icon: MailIcon, label: "Email", value: SITE.contact.email, href: `mailto:${SITE.contact.email}` },
            { Icon: ClockIcon, label: "Hours", value: SITE.contact.hours },
          ].map(({ Icon, label, value, href }) => {
            const inner = (
              <>
                <span className="shrink-0 text-accent transition-colors duration-(--duration-base) group-hover:text-ink">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className="min-w-0">
                  <span className="eyebrow block">{label}</span>
                  <span className="mt-2 block truncate text-[0.9375rem] text-ink">{value}</span>
                </span>
              </>
            );
            return href ? (
              <a key={label} href={href} className="group flex items-center gap-4">
                {inner}
              </a>
            ) : (
              <div key={label} className="flex items-center gap-4">
                {inner}
              </div>
            );
          })}
        </div>
      </Container>

      {/* Bottom bar */}
      <div className="border-t border-line">
        <Container className="flex flex-col items-center justify-between gap-6 py-12 sm:flex-row">
          <p className="text-[0.8125rem] text-stone">
            © {year} {SITE.legalName}. All rights reserved.
          </p>
          <div className="flex items-center gap-7">
            <Link href="/policy" className="text-[0.8125rem] text-stone transition-colors duration-500 hover:text-accent">
              Store Policy
            </Link>
            <Link href="/terms" className="text-[0.8125rem] text-stone transition-colors duration-500 hover:text-accent">
              Terms &amp; Conditions
            </Link>
            <a
              href={SITE.social.instagram}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="text-stone transition-colors duration-(--duration-base) hover:text-accent"
            >
              <InstagramIcon className="h-4.5 w-4.5" />
            </a>
          </div>
        </Container>
      </div>
    </footer>
  );
}

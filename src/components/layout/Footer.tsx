import Link from "next/link";
import { FOOTER_NAV, SITE } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { Accordion } from "@/components/ui/Accordion";
import { ClockIcon, InstagramIcon, MailIcon, PhoneIcon } from "@/components/ui/Icons";
import { NewsletterForm } from "./NewsletterForm";

/**
 * Footer: brand and newsletter beside the link columns, then contact, then the
 * legal bar.
 *
 * Spacing is deliberately tighter than the page's section rhythm — a footer on
 * the `--spacing-section` scale ran to most of a screen in height, which read
 * as the page trailing off rather than closing. Below `sm` the link columns
 * become an accordion so four stacked lists don't turn into a long scroll.
 */
function LinkList({ links }: { links: { label: string; href: string }[] }) {
  return (
    <ul className="space-y-3">
      {links.map((link) => (
        <li key={link.href + link.label}>
          <Link
            href={link.href}
            className="text-[0.875rem] text-ink-soft transition-colors duration-(--duration-base) hover:text-accent"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function Footer() {
  const year = 2026;
  return (
    <footer className="border-t border-line bg-background">
      <Container className="pt-14 pb-10 lg:pt-20 lg:pb-14">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_2fr] lg:gap-20">
          {/* Brand + newsletter */}
          <div className="max-w-sm">
            <Link
              href="/"
              className="font-display text-[1.75rem] leading-none tracking-[0.3em] text-ink"
            >
              {SITE.name}
            </Link>
            <p className="mt-5 max-w-xs text-[0.875rem] leading-[1.75] text-ink-soft">
              {SITE.description}
            </p>
            <p className="eyebrow mt-8">Join the list</p>
            <p className="mb-4 mt-2.5 text-[0.875rem] leading-[1.75] text-ink-soft">
              Early access to new drops and quiet stories from the studio.
            </p>
            <NewsletterForm />
            <a
              href={SITE.social.instagram}
              target="_blank"
              rel="noreferrer"
              className="micro-label mt-6 inline-flex items-center gap-2.5 transition-colors duration-(--duration-base) hover:text-accent"
            >
              <InstagramIcon className="h-4.5 w-4.5" />
              {SITE.social.instagramHandle}
            </a>
          </div>

          {/* Link columns — accordion on phones, aligned columns from sm up. */}
          <div className="sm:hidden">
            <Accordion
              defaultOpen={null}
              items={FOOTER_NAV.map((col) => ({
                title: col.title,
                content: <LinkList links={col.links} />,
              }))}
            />
          </div>
          <div className="hidden sm:grid sm:grid-cols-2 sm:gap-x-8 sm:gap-y-10 lg:grid-cols-4">
            {FOOTER_NAV.map((col) => (
              <div key={col.title}>
                <h3 className="eyebrow text-ink">{col.title}</h3>
                <div className="mt-5">
                  <LinkList links={col.links} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact strip */}
        <div className="mt-12 grid gap-6 border-t border-line pt-8 sm:grid-cols-3 sm:gap-8 lg:mt-16">
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
                  <span className="mt-1 block truncate text-[0.875rem] text-ink">{value}</span>
                </span>
              </>
            );
            return href ? (
              <a key={label} href={href} className="group flex items-center gap-3.5">
                {inner}
              </a>
            ) : (
              <div key={label} className="flex items-center gap-3.5">
                {inner}
              </div>
            );
          })}
        </div>
      </Container>

      {/* Legal bar */}
      <div className="border-t border-line">
        <Container className="flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          <p className="micro-label">
            © {year} {SITE.legalName}. All rights reserved.
          </p>
          <div className="flex items-center gap-7">
            <Link
              href="/policy"
              className="micro-label transition-colors duration-(--duration-base) hover:text-accent"
            >
              Store Policy
            </Link>
            <Link
              href="/terms"
              className="micro-label transition-colors duration-(--duration-base) hover:text-accent"
            >
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

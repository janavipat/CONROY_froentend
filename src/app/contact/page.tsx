import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/layouts/PageHeader";
import { ContactForm } from "@/components/forms/ContactForm";
import { ClockIcon, MailIcon, PhoneIcon } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with CONROY. Submit general enquiries via our contact form or reach us by phone, everyday 9:00am – 5:00pm.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: `Contact · ${SITE.name}`,
    description: "Questions about your order or our denim? We're here to help.",
    url: `${SITE.url}/contact`,
  },
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="We're here to help"
        title="Contact Us"
        description="Please submit all general enquiries in the form below — or reach us directly by phone and email."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Contact" }]}
      />

      <section className="py-16 lg:py-24">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:gap-12">
            {/* Details */}
            <div className="h-fit rounded-media border border-line bg-sage p-7 sm:p-8">
              <h2 className="font-display text-2xl text-ink">Customer care</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                Our team is available everyday to assist with sizing, orders, returns and anything
                else you need.
              </p>

              <dl className="mt-8 space-y-5">
                {[
                  { Icon: PhoneIcon, label: "Phone", value: SITE.contact.phone, href: SITE.contact.phoneHref },
                  { Icon: MailIcon, label: "Email", value: SITE.contact.email, href: `mailto:${SITE.contact.email}` },
                  { Icon: ClockIcon, label: "Opening hours", value: SITE.contact.hours },
                ].map(({ Icon, label, value, href }) => (
                  <div key={label} className="flex items-start gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-ink">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-stone">{label}</dt>
                      <dd className="mt-0.5 text-[0.95rem] text-ink">
                        {href ? (
                          <a href={href} className="hover:text-stone">
                            {value}
                          </a>
                        ) : (
                          value
                        )}
                      </dd>
                    </div>
                  </div>
                ))}
              </dl>
            </div>

            {/* Form */}
            <div>
              <ContactForm />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

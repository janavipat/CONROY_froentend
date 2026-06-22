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
          <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
            {/* Details */}
            <div>
              <h2 className="font-display text-2xl text-ink">Customer care</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                Our team is available everyday to assist with sizing, orders, returns and anything
                else you need.
              </p>

              <dl className="mt-8 space-y-6">
                <div className="flex items-start gap-4">
                  <PhoneIcon className="mt-0.5 h-5 w-5 text-ink" />
                  <div>
                    <dt className="eyebrow text-stone">Phone</dt>
                    <dd className="mt-1">
                      <a href={SITE.contact.phoneHref} className="text-ink hover:text-stone">
                        {SITE.contact.phone}
                      </a>
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <MailIcon className="mt-0.5 h-5 w-5 text-ink" />
                  <div>
                    <dt className="eyebrow text-stone">Email</dt>
                    <dd className="mt-1">
                      <a href={`mailto:${SITE.contact.email}`} className="text-ink hover:text-stone">
                        {SITE.contact.email}
                      </a>
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <ClockIcon className="mt-0.5 h-5 w-5 text-ink" />
                  <div>
                    <dt className="eyebrow text-stone">Opening hours</dt>
                    <dd className="mt-1 text-ink">{SITE.contact.hours}</dd>
                  </div>
                </div>
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

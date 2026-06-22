import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/layouts/PageHeader";

export const metadata: Metadata = {
  title: "Store Policy",
  description:
    "CONROY store policy — shipping, returns, exchanges and privacy. Read about our 7-day returns and delivery timelines.",
  alternates: { canonical: "/policy" },
  openGraph: {
    title: `Store Policy · ${SITE.name}`,
    description: "Shipping, returns, exchanges and privacy at CONROY.",
    url: `${SITE.url}/policy`,
  },
};

const SECTIONS = [
  {
    id: "shipping",
    title: "Shipping Policy",
    paragraphs: [
      "Orders are processed within 1–2 business days. Once dispatched, standard delivery typically arrives within 6–7 business days. Expedited options are available at checkout.",
      "Complimentary standard shipping is offered on all orders across India. You will receive tracking details by email as soon as your order ships.",
    ],
  },
  {
    id: "returns",
    title: "Returns & Exchanges",
    paragraphs: [
      "We accept returns within 7 days from the date of delivery. To be eligible, items must be unused, unworn and unwashed, with all original labels, tags and packaging attached.",
      "Original delivery charges are non-refundable, except where an item is faulty or incorrect. Customers are responsible for return shipping unless the return qualifies as defective or incorrect.",
      "Once your return is received and inspected, we will notify you of the approval of your refund, which will be processed to your original payment method.",
    ],
  },
  {
    id: "privacy",
    title: "Privacy Policy",
    paragraphs: [
      "We respect your privacy. Personal information collected at checkout is used solely to process your order, provide support and, with your consent, share occasional updates.",
      "We never sell your data. Payment information is handled by secure, encrypted, PCI-compliant providers.",
    ],
  },
  {
    id: "terms",
    title: "Terms of Service",
    paragraphs: [
      "By accessing this website and placing an order, you agree to our terms of service. We only carry designs we believe in, ethically and aesthetically — original, authentic pieces made to last.",
      "Prices and availability are subject to change without notice. We reserve the right to refuse or cancel any order at our discretion.",
    ],
  },
];

export default function PolicyPage() {
  return (
    <>
      <PageHeader
        eyebrow="The fine print"
        title="Store Policy"
        description="Everything you need to know about shipping, returns, privacy and our terms."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Store Policy" }]}
      />

      <section className="py-16 lg:py-24">
        <Container className="max-w-3xl">
          {/* Quick links */}
          <nav className="mb-12 flex flex-wrap gap-2">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="rounded-full border border-line px-4 py-1.5 text-xs uppercase tracking-[0.12em] text-ink-soft transition-colors hover:border-ink hover:text-ink"
              >
                {s.title}
              </a>
            ))}
          </nav>

          <div className="space-y-14">
            {SECTIONS.map((section) => (
              <article key={section.id} id={section.id} className="scroll-mt-28">
                <h2 className="font-display text-2xl text-ink sm:text-3xl">{section.title}</h2>
                <div className="mt-4 space-y-4">
                  {section.paragraphs.map((p, i) => (
                    <p key={i} className="text-[0.95rem] leading-relaxed text-ink-soft">
                      {p}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <p className="mt-16 border-t border-line pt-8 text-sm text-stone">
            Questions about any of the above? Reach us at{" "}
            <a href={`mailto:${SITE.contact.email}`} className="text-ink hover:underline">
              {SITE.contact.email}
            </a>{" "}
            or {SITE.contact.phone}.
          </p>
        </Container>
      </section>
    </>
  );
}

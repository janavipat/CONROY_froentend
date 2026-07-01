import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/layouts/PageHeader";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "CONROY General Terms and Conditions governing all sales of products and services made through our website and platforms.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: `Terms & Conditions · ${SITE.name}`,
    description: "The General Terms and Conditions for purchases from CONROY.",
    url: `${SITE.url}/terms`,
  },
};

const EFFECTIVE_DATE = "October 30, 2025";

const SECTIONS = [
  {
    id: "general-terms-of-sale",
    title: "1. General Terms of Sale",
    paragraphs: [
      "1.1 All sales and deliveries are subject exclusively to these General Terms and Conditions of Sale (“GTS”).",
      "1.2 Any differing terms proposed by the Customer will not be accepted unless confirmed in writing by Conroy.",
      "1.3 Orders shall be considered confirmed upon receipt of order confirmation by Conroy.",
      "1.4 Conroy reserves the right to update or modify these Terms at any time without prior notice.",
    ],
  },
  {
    id: "products-and-services",
    title: "2. Products and Services",
    paragraphs: [
      "2.1 Conroy offers both physical products (e.g., apparel, accessories) and digital services (e.g., customization, styling, or online consultations).",
      "2.2 Product descriptions, images, and specifications are provided for general information purposes only.",
      "2.3 We reserve the right to modify or discontinue any product or service at any time.",
    ],
  },
  {
    id: "pricing-and-payment",
    title: "3. Pricing and Payment",
    paragraphs: [
      "3.1 All prices are displayed in Indian Rupees (INR) and are inclusive of applicable taxes unless otherwise stated.",
      "3.2 Payment must be made in full at the time of purchase via approved payment gateways such as Razorpay, Stripe, or other available options.",
      "3.3 Conroy reserves the right to correct any pricing errors or inaccuracies at any time without prior notice.",
    ],
  },
  {
    id: "shipping-and-delivery",
    title: "4. Shipping and Delivery",
    paragraphs: [
      "4.1 Orders are processed and shipped within the estimated timelines shown at checkout.",
      "4.2 Shipping times may vary depending on product availability, delivery location, and courier service.",
      "4.3 Risk of loss or damage passes to the Customer upon delivery to the shipping carrier.",
      "4.4 Conroy is not liable for delays due to circumstances beyond its control, such as strikes, natural disasters, or courier disruptions.",
    ],
  },
  {
    id: "returns-and-refunds",
    title: "5. Return and Refund Policy",
    paragraphs: [
      "5.1 Customers may request returns or refunds within 7 days of receiving the product, provided the product is unused, unworn, and in original packaging.",
      "5.2 Custom-made or personalized items are non-refundable unless defective or damaged.",
      "5.3 Refunds (if approved) will be processed to the original payment method within 7–10 business days.",
      "5.4 Shipping and handling charges are non-refundable.",
    ],
  },
  {
    id: "service-terms",
    title: "6. Service Terms",
    paragraphs: [
      "6.1 For digital or styling services, Conroy will provide agreed deliverables as per the package selected by the Customer.",
      "6.2 Any cancellation or rescheduling must be made at least 24 hours before the scheduled service time.",
      "6.3 Conroy reserves the right to refuse or cancel services for misuse, inappropriate behavior, or breach of these Terms.",
    ],
  },
  {
    id: "intellectual-property",
    title: "7. Intellectual Property",
    paragraphs: [
      "7.1 All content on the Website, including images, logos, designs, and text, is owned or licensed by Conroy.",
      "7.2 You may not reproduce, copy, distribute, or use any materials without prior written permission from Conroy.",
    ],
  },
  {
    id: "limitation-of-liability",
    title: "8. Limitation of Liability",
    paragraphs: [
      "8.1 Conroy is not liable for any indirect, incidental, or consequential damages arising from product use or inability to use the Website.",
      "8.2 Total liability shall not exceed the purchase price of the product or service in question.",
    ],
  },
  {
    id: "privacy-and-data",
    title: "9. Privacy and Data Protection",
    paragraphs: [
      "9.1 Your personal data will be processed in accordance with our Privacy Policy, available on our Website.",
      "9.2 By using our Website, you consent to the collection and processing of your data as described therein.",
    ],
  },
  {
    id: "governing-law",
    title: "10. Governing Law and Jurisdiction",
    paragraphs: [
      "10.1 These Terms shall be governed by and construed under the laws of India, specifically within the jurisdiction of Ahmedabad, Gujarat.",
      "10.2 Any disputes arising out of these Terms shall be subject to the exclusive jurisdiction of the courts of Ahmedabad.",
    ],
  },
];

export default function TermsPage() {
  return (
    <>
      <PageHeader
        eyebrow="The fine print"
        title="Terms & Conditions"
        description="The General Terms and Conditions governing all sales of products and services made through CONROY."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Terms & Conditions" }]}
      />
      <section className="py-14 lg:py-20">
        <Container className="max-w-3xl">
          <p className="text-sm text-stone">Effective Date: {EFFECTIVE_DATE}</p>
          <p className="mt-4 text-[0.95rem] leading-relaxed text-ink-soft">
            Welcome to Conroy (“we,” “our,” or “us”). These General Terms and Conditions (“Terms”)
            govern all sales of products and services made through our website, applications, and
            associated platforms (collectively, the “Website”). By accessing or purchasing from our
            Website, you (“Customer,” “you,” or “your”) agree to be bound by these Terms. If you do
            not agree to these Terms, please do not use our Website or make any purchase.
          </p>

          {/* Quick nav */}
          <nav className="mt-10 flex flex-wrap gap-2">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="rounded-full border border-line px-4 py-1.5 text-xs tracking-[0.01em] text-ink-soft transition-colors hover:border-ink hover:text-ink"
              >
                {s.title}
              </a>
            ))}
          </nav>

          <div className="mt-14 space-y-14">
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

            {/* Contact */}
            <article id="contact" className="scroll-mt-28">
              <h2 className="font-display text-2xl text-ink sm:text-3xl">11. Contact Information</h2>
              <p className="mt-4 text-[0.95rem] leading-relaxed text-ink-soft">
                For any questions, complaints, or support inquiries, please contact us at:
              </p>
              <ul className="mt-4 space-y-1.5 text-[0.95rem] text-ink-soft">
                <li className="font-medium text-ink">Conroy Support Team</li>
                <li>
                  📧 Email:{" "}
                  <a href="mailto:support@conroy.in" className="text-ink hover:underline">
                    support@conroy.in
                  </a>
                </li>
                <li>📍 Address: Ahmedabad, Gujarat, India</li>
                <li>
                  📞 Phone:{" "}
                  <a href="tel:+919998009904" className="text-ink hover:underline">
                    +91-9998009904
                  </a>
                </li>
              </ul>
            </article>
          </div>

          <p className="mt-16 border-t border-line pt-8 text-sm text-stone">
            © 2025 Conroy. All rights reserved.
          </p>
        </Container>
      </section>
    </>
  );
}

import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Inter } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/site";
import { StoreChrome } from "@/components/layout/StoreChrome";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import { Providers } from "./providers";

// Display — Bodoni Moda: the didone the fashion press is set in. Extreme
// stroke contrast, so it is used at display sizes only; below about 24px the
// hairlines start to disappear and Inter takes over.
const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

// Body & UI — Inter: a neutral grotesque that stays out of the serif's way and
// does the actual work — navigation, product names, prices, forms.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

/**
 * Organization and WebSite, from the details already in site config.
 *
 * SearchAction tells Google the storefront has its own search, which is what
 * can earn a sitelinks search box. The search page itself stays out of the
 * index — the action points at it, it does not need to rank.
 */
const SITE_SCHEMA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      // Brand rather than a bare Organization: CONROY is the label on the
      // clothing, and it is the label every Product node names as its brand.
      // Declaring the same @id under both types lets those Product references
      // resolve to this entity instead of to a loose string.
      "@type": ["Organization", "Brand"],
      "@id": `${SITE.url}/#organization`,
      name: SITE.name,
      legalName: SITE.legalName,
      url: SITE.url,
      logo: {
        "@type": "ImageObject",
        url: `${SITE.url}/android-chrome-512x512.png`,
        width: 512,
        height: 512,
      },
      image: `${SITE.url}/opengraph-image`,
      description: SITE.description,
      slogan: SITE.tagline,
      email: SITE.contact.email,
      telephone: SITE.contact.phone,
      // Ahmedabad, Gujarat — the address on the Terms page, and the
      // jurisdiction the terms are written under. No street line is published,
      // so none is claimed here.
      address: {
        "@type": "PostalAddress",
        addressLocality: "Ahmedabad",
        addressRegion: "Gujarat",
        addressCountry: "IN",
      },
      areaServed: { "@type": "Country", name: "India" },
      currenciesAccepted: SITE.currency,
      // Only the profile that actually exists. Adding unverified handles is
      // how an entity ends up associated with an account someone else owns.
      sameAs: [SITE.social.instagram],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        email: SITE.contact.email,
        telephone: SITE.contact.phone,
        areaServed: "IN",
        availableLanguage: ["en"],
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      url: SITE.url,
      name: SITE.name,
      description: SITE.description,
      publisher: { "@id": `${SITE.url}/#organization` },
      inLanguage: "en-IN",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE.url}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    // Says what CONROY sells. The tagline alone told a searcher nothing about
    // the category, and the homepage is the one page competing on brand terms.
    default: `${SITE.name} — Premium Denim & Modern Menswear`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  keywords: [
    "CONROY",
    "premium denim",
    "men's jeans",
    "straight fit jeans",
    "relax fit jeans",
    "quiet luxury",
    "sustainable fashion",
  ],
  authors: [{ name: SITE.name }],
  applicationName: SITE.name,
  alternates: { canonical: "/" },
  // Brand mark, served from /public. The icons carry the CONROY ink plate
  // rather than a bare transparent mark: the logo is white-only, so on a
  // transparent background it would vanish against light browser chrome.
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48", type: "image/x-icon" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} — Premium Denim & Modern Menswear`,
    description: SITE.description,
    url: SITE.url,
    locale: SITE.locale,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — Premium Denim & Modern Menswear`,
    description: SITE.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  // Matches --color-ink.
  themeColor: "#0a0a0b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bodoni.variable} ${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background">
        {/* Site-wide identity, declared once. Page-level routes add their own
            Product, BreadcrumbList and ItemList nodes; keeping Organization and
            WebSite here means no route repeats them and none can conflict. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(SITE_SCHEMA) }}
        />
        <Providers>
          <StoreChrome>{children}</StoreChrome>
        </Providers>
        {/* Renders nothing; its only job is registering the worker whose fetch
            handler Chrome looks for before offering to install the app. */}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}

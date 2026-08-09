import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Inter } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/site";
import { StoreChrome } from "@/components/layout/StoreChrome";
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
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
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: SITE.url,
    locale: SITE.locale,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
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
        <Providers>
          <StoreChrome>{children}</StoreChrome>
        </Providers>
      </body>
    </html>
  );
}

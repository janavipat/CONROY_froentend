import type { Metadata, Viewport } from "next";
import { Playfair_Display, EB_Garamond } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/site";
import { StoreChrome } from "@/components/layout/StoreChrome";
import { Providers } from "./providers";

// Body stays on the native system sans; headings use Playfair Display — a
// high-contrast neoclassical serif close to Ralph Lauren's ITC Fenice.
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

// EB Garamond — a timeless old-style serif for body & UI (classic, refined).
const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
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
  // Matches the icon plate and --color-ink.
  themeColor: "#15243c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${ebGaramond.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-white">
        <Providers>
          <StoreChrome>{children}</StoreChrome>
        </Providers>
      </body>
    </html>
  );
}

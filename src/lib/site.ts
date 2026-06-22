import type { NavLink, ServiceFeature, Testimonial } from "@/types";

/**
 * Central site configuration — brand, navigation, contact details and social
 * links. Mirrors the public structure of conroy.global.
 */
export const SITE = {
  name: "CONROY",
  legalName: "CONROY",
  tagline: "Soft Comfort, Bold Looks",
  description:
    "CONROY crafts premium denim for the modern wardrobe — quiet luxury, honest materials and enduring silhouettes made to be lived in and passed down.",
  // Used for canonical URLs, Open Graph and the sitemap.
  url: "https://conroy.global",
  locale: "en_IN",
  currency: "INR",
  contact: {
    phone: "+91 99980 09904",
    phoneHref: "tel:+919998009904",
    email: "info@conroy.global",
    hours: "Everyday 9:00am – 5:00pm",
  },
  social: {
    instagram: "https://www.instagram.com/conroy.official/",
    instagramHandle: "@conroy.official",
  },
} as const;

export const PRIMARY_NAV: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Catalog", href: "/collections/all" },
  { label: "About us", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const FOOTER_NAV: { title: string; links: NavLink[] }[] = [
  {
    title: "Shop",
    links: [
      { label: "All Products", href: "/collections/all" },
      { label: "Straight Fit", href: "/collections/romano-fit-noir-classique" },
      { label: "Relax Fit", href: "/collections/romano-fit-bleu-heritage" },
      { label: "Search", href: "/search" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us", href: "/about" },
      { label: "Contact us", href: "/contact" },
      { label: "Store Policy", href: "/policy" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Login", href: "/account/login" },
      { label: "Register", href: "/account/register" },
      { label: "Cart", href: "/cart" },
    ],
  },
];

export const SERVICE_FEATURES: ServiceFeature[] = [
  {
    title: "Free Shipping",
    description: "Complimentary delivery on every order across India.",
    icon: "shipping",
  },
  {
    title: "Easy Returns",
    description: "7-day hassle-free returns on unworn pieces.",
    icon: "returns",
  },
  {
    title: "Online Support",
    description: "Real people, everyday 9:00am – 5:00pm.",
    icon: "support",
  },
  {
    title: "Secure Checkout",
    description: "Encrypted, trusted payments you can rely on.",
    icon: "secure",
  },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "The denim feels considered — soft from the first wear yet structured enough to hold its shape. It has become my everyday pair.",
    author: "Aarav Mehta",
    location: "Mumbai",
  },
  {
    quote:
      "Quiet, refined and beautifully made. CONROY understands that real luxury whispers. The fit is impeccable.",
    author: "Ishita Rao",
    location: "Bengaluru",
  },
  {
    quote:
      "Finally, jeans that balance comfort and tailoring. The fabric weight and finishing are a clear step above.",
    author: "Kabir Singh",
    location: "Delhi",
  },
];

/** Trending searches shown in the search modal, mirroring the live site. */
export const TRENDING_SEARCHES = ["Straight Fit", "Relax Fit", "Black Denim", "Blue Denim"];

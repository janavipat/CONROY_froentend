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
  { label: "Collection", href: "/collections/all" },
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
      "My buying experience was smooth and hassle-free. The quality exceeded expectations and delivery was on time.",
    author: "Karan Patel",
    location: "Verified buyer",
    rating: 5,
    timeframe: "1 week ago",
  },
  {
    quote:
      "Very satisfied with my purchase. The product looks premium and performs exactly as described.",
    author: "Rahul Shah",
    location: "Verified buyer",
    rating: 4,
    timeframe: "1 week ago",
  },
  {
    quote:
      "Amazing experience from ordering to delivery. Everything was well packed and arrived in perfect condition.",
    author: "Priya Mehta",
    location: "Verified buyer",
    rating: 4,
    timeframe: "4 weeks ago",
  },
  {
    quote:
      "One of the best purchases I've made recently. Easy ordering process, fast delivery, and excellent quality.",
    author: "Nimay Sharma",
    location: "Verified buyer",
    rating: 5,
    timeframe: "2 weeks ago",
  },
  {
    quote: "Well packed and arrived in perfect condition.",
    author: "Umang Sinh",
    location: "Verified buyer",
    rating: 5,
    timeframe: "6 weeks ago",
  },
];

/** Trending searches shown in the search modal, mirroring the live site. */
export const TRENDING_SEARCHES = ["Straight Fit", "Relax Fit", "Black Denim", "Blue Denim"];

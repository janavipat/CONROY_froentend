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

/**
 * The storefront's primary navigation — one model driving the desktop header,
 * the mega-menu and the mobile drawer, so the three can't drift apart.
 *
 * `children` turns an item into a dropdown; `mega` upgrades that dropdown to a
 * panel with photography. Every item is listed here rather than fetched, so
 * the navigation can't change shape depending on what an admin happens to have
 * created.
 */
export interface NavItem extends NavLink {
  children?: NavLink[];
  /**
   * Swaps the plain link list for a product panel.
   *
   *   newIn         the products an admin has marked New In — the discovery
   *                 surface that used to be an always-visible (and usually
   *                 empty) homepage rail
   *   productTypes  what CONROY makes, one entry per product type, with a
   *                 photograph beside it
   */
  mega?: "newIn" | "productTypes";
}

/**
 * The product types the Collections menu offers, in order.
 *
 * These are types — what the garment is — not the merchandising collections an
 * admin creates ("Romano Fit · Bleu Heritage" and the like). Those still exist
 * and remain reachable at /collections/[handle]; they are simply not what a
 * shopper opens a Collections menu expecting to find.
 *
 * `productType` matches the catalogue field of the same name, which is how the
 * menu finds a photograph for each entry.
 */
export const PRODUCT_TYPE_NAV: (NavLink & { productType: string })[] = [
  { label: "Jeans", href: "/denim", productType: "Jeans" },
  { label: "Trousers", href: "/trousers", productType: "Trousers" },
  { label: "Linen", href: "/linen", productType: "Linen" },
];

/**
 * Collections withdrawn from the storefront.
 *
 * The T-shirt section has been taken off the site. Its two fabric collections
 * still exist in the catalogue and in admin — nothing is deleted — but the
 * storefront no longer lists, links, prerenders or serves them: a direct visit
 * answers with the site's standard 404.
 */
export const RETIRED_COLLECTION_HANDLES: readonly string[] = [
  "cotton-tshirt",
  "cotton-lycra-tshirt",
];

export const PRIMARY_NAV: NavItem[] = [
  { label: "New In", href: "/new-in", mega: "newIn" },
  {
    label: "Denim",
    href: "/denim",
    children: [
      { label: "All Denim", href: "/denim" },
      // Fits — how the garment is cut.
      { label: "Slim", href: "/denim/slim" },
      { label: "Straight", href: "/denim/straight" },
      { label: "Relaxed", href: "/denim/relaxed" },
      // A merchandising grouping, not a fit — resolved via the collection.
      { label: "Vintage", href: "/denim/vintage" },
    ],
  },
  { label: "Trousers", href: "/trousers" },
  { label: "Linen", href: "/linen" },
  {
    label: "Collections",
    href: "/collections",
    mega: "productTypes",
    // The same entries the desktop panel shows, so the mobile drawer can
    // expand them without a second list to keep in step.
    children: PRODUCT_TYPE_NAV.map(({ label, href }) => ({ label, href })),
  },
  { label: "Shop the Look", href: "/shop-the-look" },
  { label: "About", href: "/about" },
];

export const FOOTER_NAV: { title: string; links: NavLink[] }[] = [
  {
    title: "Shop",
    links: [
      { label: "New In", href: "/new-in" },
      { label: "Denim", href: "/denim" },
      { label: "Trousers", href: "/trousers" },
      { label: "Linen", href: "/linen" },
      { label: "Collections", href: "/collections" },
    ],
  },
  {
    title: "Help",
    links: [
      // Shipping and Returns live inside the policy page today; they get
      // their own routes when that content is split out.
      { label: "Shipping", href: "/policy" },
      { label: "Returns", href: "/policy" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "About CONROY", href: "/about" },
      { label: "Our Story", href: "/about" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Login", href: "/account/login" },
      { label: "Register", href: "/account/register" },
      { label: "Wishlist", href: "/wishlist" },
      { label: "Bag", href: "/cart" },
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

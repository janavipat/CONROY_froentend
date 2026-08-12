/** Shared domain types for the CONROY storefront. */

export type FitType = "Straight fit" | "Relax fit";

export interface ProductImage {
  src: string;
  alt: string;
}

export interface ProductVariant {
  id: string;
  size: string;
  fit: FitType;
  available: boolean;
}

export interface Product {
  id: string;
  handle: string;
  title: string;
  /** Short marketing line shown on cards. */
  tagline: string;
  /** Long-form description (rendered as paragraphs). */
  description: string;
  /** Customer-facing merchandising name, e.g. "Jet Black". Free text. */
  color: string;
  fit: FitType;
  /** What the garment is — "Jeans", "T-Shirt". */
  productType?: string;
  /** The department — "Denim", "T-Shirts". */
  category?: string;
  /** Filterable colour bucket, e.g. "Black" for a "Jet Black" product. */
  standardColor?: string;
  /** Merchandising rails — admin-controlled, never derived from createdAt. */
  isNewIn?: boolean;
  newInOrder?: number;
  isBestSeller?: boolean;
  bestSellerOrder?: number;
  /** For "Newest" sorting only. Does NOT determine New In. */
  createdAt?: string;
  price: number;
  compareAtPrice?: number;
  /**
   * Saving as a whole percent, computed by the API from price vs
   * compareAtPrice. Absent when there is no real discount — the UI renders it
   * as-is and never derives its own figure.
   */
  discountPercent?: number;
  currency: string;
  sizes: string[];
  images: ProductImage[];
  collections: string[];
  details: string[];
  stock: number;
  sku?: string;
  status?: "active" | "draft" | "archived";
  rating: number;
  reviewCount: number;
  badge?: string;
  // Shipping — used to compute courier weight/volumetric-weight charges.
  weightG?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  isShippable?: boolean;
}

export interface Collection {
  handle: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  productHandles: string[];
}

export interface NavLink {
  label: string;
  href: string;
}

export interface CartItem {
  productHandle: string;
  title: string;
  image: string;
  price: number;
  currency: string;
  size: string;
  fit: FitType;
  quantity: number;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  images: string[];
  createdAt: string;
}

export interface ReviewSummary {
  average: number;
  count: number;
  /** Count of reviews per star (keys "5".."1"). */
  breakdown: Record<string, number>;
  /** All review photos, newest first. */
  photos: string[];
}

export interface Testimonial {
  quote: string;
  author: string;
  location: string;
  rating: number;
  timeframe: string;
}

export interface ServiceFeature {
  title: string;
  description: string;
  icon: "shipping" | "returns" | "support" | "secure";
}

export interface ContactFormValues {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

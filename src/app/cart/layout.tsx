import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/seo";

/**
 * The cart is a client component and cannot export metadata itself, so it sat
 * on the root layout's — inheriting the homepage title, the homepage
 * description and, worst of all, the homepage canonical. Google was told the
 * cart and the homepage were the same page.
 */
export const metadata: Metadata = privatePageMetadata(
  "Your Cart",
  "Review the items in your CONROY cart before checkout.",
  "/cart",
);

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/seo";

/** Checkout is a private step in a purchase; it should never be indexed. */
export const metadata: Metadata = privatePageMetadata(
  "Checkout",
  "Complete your CONROY order.",
  "/checkout",
);

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}

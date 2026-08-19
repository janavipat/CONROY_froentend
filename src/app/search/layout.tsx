import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/seo";

/**
 * Search results are generated per query and have nothing stable to rank, so
 * the page is noindex — but it links on to real product pages, hence follow.
 * It previously inherited the homepage canonical, which pointed Google at the
 * homepage from every search URL.
 */
export const metadata: Metadata = privatePageMetadata(
  "Search",
  "Search the CONROY catalogue of men's denim and T-shirts.",
  "/search",
);

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}

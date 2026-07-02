"use client";

import { usePathname } from "next/navigation";
import { AnnouncementBar } from "./AnnouncementBar";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { OfferPopup } from "@/components/offers/OfferPopup";
import { VisitorBeacon } from "@/components/analytics/VisitorBeacon";

/**
 * Renders the storefront chrome (announcement bar, header, footer) — except on
 * /admin, which has its own sidebar layout.
 */
export function StoreChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <VisitorBeacon />
      <AnnouncementBar />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <OfferPopup />
    </>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { AnnouncementBar } from "./AnnouncementBar";
import { MaintenanceBanner } from "./MaintenanceBanner";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { ScrollToTop } from "./ScrollToTop";
import { GlobalRouteProgress } from "./GlobalRouteProgress";
import { OfferPopup } from "@/components/offers/OfferPopup";
import { GuestOfferPopup } from "@/components/offers/GuestOfferPopup";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { VisitorBeacon } from "@/components/analytics/VisitorBeacon";
import { LocationConsent } from "@/components/analytics/LocationConsent";
import { MetaPixel } from "@/components/analytics/MetaPixel";

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
      <ScrollToTop />
      {/* Route transitions get the hairline bar on every storefront page, not
          only the handful of routes that happen to have a loading.tsx. */}
      <GlobalRouteProgress />
      <VisitorBeacon />
      {/* Storefront only — admin sessions are not shopper traffic. */}
      <MetaPixel />
      <LocationConsent />
      <MaintenanceBanner />
      <AnnouncementBar />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <OfferPopup />
      <GuestOfferPopup />
      <ChatWidget />
    </>
  );
}

"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { META_PIXEL_ID, trackPixelPageView } from "@/lib/meta-pixel";

/**
 * Records one PageView per URL — the first load and every client-side
 * navigation after it. The last URL sent is held in a ref, so React Strict
 * Mode's double effect run (and any re-render) can't report the same page
 * twice.
 */
function PageViews() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const lastUrl = useRef<string | null>(null);

  useEffect(() => {
    const url = search ? `${pathname}?${search}` : pathname;
    if (lastUrl.current === url) return;
    lastUrl.current = url;
    trackPixelPageView();
  }, [pathname, search]);

  return null;
}

export function MetaPixel() {
  return (
    <>
      {/* useSearchParams needs a Suspense boundary, or every static page
          would be forced into client-side rendering. */}
      <Suspense fallback={null}>
        <PageViews />
      </Suspense>
      {/* Meta's fallback for visitors with JavaScript disabled. */}
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}

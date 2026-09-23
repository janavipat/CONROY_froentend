import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkProductExists } from "@/lib/product-existence";

/**
 * Real 404s for products that don't exist.
 *
 * The root loading.tsx wraps every page in a Suspense boundary, so by the time
 * a product page finds its handle missing the 200 status has been sent and
 * notFound() can only change the body. Proxy runs before any rendering, so a
 * status set here is the status the client gets.
 *
 * Only `/products/<handle>` is matched. A handle the API confirms is missing is
 * rewritten to a path with no route, which renders the site's normal 404 page
 * with a genuine 404 status. Every other outcome — the product exists, the API
 * is unreachable, no remote API is configured — falls through untouched, so a
 * valid product page never depends on this check succeeding.
 */
export async function proxy(request: NextRequest) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  // Without a remote API the storefront serves its bundled fallback catalogue;
  // there is nothing authoritative to check against.
  if (!apiBase || !/^https?:\/\//.test(apiBase)) return NextResponse.next();

  let handle: string;
  try {
    handle = decodeURIComponent(request.nextUrl.pathname.split("/")[2] ?? "");
  } catch {
    return NextResponse.next();
  }
  if (!handle) return NextResponse.next();

  const existence = await checkProductExists(apiBase, handle);
  if (existence === "missing") {
    return NextResponse.rewrite(new URL("/product-not-found", request.url));
  }
  return NextResponse.next();
}

// Exactly one segment after /products — nothing else is intercepted.
export const config = {
  matcher: "/products/:handle",
};

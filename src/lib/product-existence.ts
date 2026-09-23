/**
 * Does the catalogue API know this product handle?
 *
 * Used by `src/proxy.ts` so a request for a product that doesn't exist can be
 * answered with a real HTTP 404 before any page renders. Once the root
 * loading.tsx boundary has started streaming, the 200 status line is already
 * sent and `notFound()` can only swap the body ("soft 404") — Next's own
 * streaming guide names `proxy` as the way to get a real status.
 *
 * Fail open: anything short of a definite "the API says 404" returns
 * "unknown", and the caller lets the page render as it always has. A slow or
 * failing API can therefore never take a valid product page offline; the worst
 * case is a missing product answering 200 again, exactly as before.
 *
 * The small in-memory memo only saves round trips. Nothing depends on it, so it
 * is fine that each server instance keeps its own and that it resets.
 */
export type ProductExistence = "exists" | "missing" | "unknown";

const FOUND_TTL_MS = 60_000;
const MISSING_TTL_MS = 30_000;
const TIMEOUT_MS = 2_500;
const MAX_ENTRIES = 500;

const memo = new Map<string, { result: "exists" | "missing"; until: number }>();

export async function checkProductExists(
  apiBase: string,
  handle: string,
  fetchImpl: typeof fetch = fetch,
  now: () => number = Date.now,
): Promise<ProductExistence> {
  const hit = memo.get(handle);
  if (hit && hit.until > now()) return hit.result;

  let status: number;
  try {
    const res = await fetchImpl(`${apiBase}/products/${encodeURIComponent(handle)}`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    status = res.status;
  } catch {
    return "unknown"; // network error or timeout
  }

  let result: "exists" | "missing";
  if (status === 404) result = "missing";
  else if (status >= 200 && status < 300) result = "exists";
  else return "unknown"; // 5xx, 429, 401… not evidence about this handle

  // Handles come from the URL, so bound the memo against a crawler walking
  // junk paths.
  if (memo.size >= MAX_ENTRIES) memo.clear();
  memo.set(handle, {
    result,
    until: now() + (result === "exists" ? FOUND_TTL_MS : MISSING_TTL_MS),
  });
  return result;
}

/** Test seam: forget everything remembered. */
export function resetProductExistenceMemo(): void {
  memo.clear();
}

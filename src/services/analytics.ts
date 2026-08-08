import { api } from "./api";

/** Stable per-tab session id (shared with the live-visitor beacon). */
export function sessionId(): string {
  try {
    let id = sessionStorage.getItem("conroy.sid");
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem("conroy.sid", id);
    }
    return id;
  } catch {
    return "anon";
  }
}

/** A durable anonymous id for wishlist ownership (survives tabs/sessions). */
export function anonUserKey(): string {
  try {
    let id = localStorage.getItem("conroy.uid");
    if (!id) {
      id = "anon_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("conroy.uid", id);
    }
    return id;
  } catch {
    return "anon";
  }
}

/**
 * Records a page view + time-on-page. Uses sendBeacon so it survives unload.
 * Pass the signed-in shopper so the admin can replay one customer's journey
 * instead of an anonymous session.
 */
export function trackPageView(
  path: string,
  durationMs: number,
  who?: { phone?: string | null; email?: string | null },
): void {
  const body = JSON.stringify({
    sessionId: sessionId(),
    path,
    durationMs,
    phone: who?.phone || undefined,
    email: who?.email || undefined,
  });
  const url = `${api.defaults.baseURL ?? ""}/analytics/pageview`;
  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
      return;
    }
  } catch {
    /* fall through to fetch */
  }
  api.post("/analytics/pageview", JSON.parse(body)).catch(() => {});
}

/**
 * Marks this session offline immediately (tab closed / navigating away), so
 * the admin's live-visitor list doesn't wait out the presence timeout. Best
 * effort — uses sendBeacon so it survives unload; if that's unavailable the
 * visitor still drops off once their heartbeat goes stale.
 */
export function trackLeave(sid: string): void {
  const body = JSON.stringify({ sessionId: sid });
  const url = `${api.defaults.baseURL ?? ""}/track/leave`;
  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
      return;
    }
  } catch {
    /* fall through to fetch */
  }
  api.post("/track/leave", JSON.parse(body)).catch(() => {});
}

/**
 * Records an add-to-cart event for a product (best-effort). Pass the signed-in
 * shopper's phone/email so the admin can see customer-wise abandoned carts.
 */
export function trackCartAdd(
  productHandle: string,
  who?: { phone?: string | null; email?: string | null },
  what?: { size?: string; quantity?: number; price?: number; currency?: string },
): void {
  api
    .post("/analytics/cart-add", {
      sessionId: sessionId(),
      productHandle,
      phone: who?.phone || undefined,
      email: who?.email || undefined,
      size: what?.size,
      quantity: what?.quantity,
      price: what?.price,
      currency: what?.currency,
    })
    .catch(() => {});
}

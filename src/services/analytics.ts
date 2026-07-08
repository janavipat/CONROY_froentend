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

/** Records a page view + time-on-page. Uses sendBeacon so it survives unload. */
export function trackPageView(path: string, durationMs: number): void {
  const body = JSON.stringify({ sessionId: sessionId(), path, durationMs });
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

/** Records an add-to-cart event for a product (best-effort). */
export function trackCartAdd(productHandle: string): void {
  api.post("/analytics/cart-add", { sessionId: sessionId(), productHandle }).catch(() => {});
}

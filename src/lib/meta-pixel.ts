/**
 * Meta (Facebook) Pixel.
 *
 * Loaded and driven from code rather than a pasted snippet so that every event
 * goes through one place: the pixel is initialised exactly once, nothing is
 * sent from previews or localhost, and a visitor whose browser sends Global
 * Privacy Control is never tracked at all.
 *
 * Product IDs are product handles — the identifier the cart, the orders API
 * and the product URLs already share. Nothing personal (name, email, phone,
 * address) is ever passed as an event parameter.
 */

export const META_PIXEL_ID = "1640360620954859";

/** Only the production storefront reports. Previews and local runs stay silent. */
const PRODUCTION_HOSTS = new Set(["www.conroy.global", "conroy.global"]);

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push: Fbq;
  loaded: boolean;
  version: string;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
  interface Navigator {
    globalPrivacyControl?: boolean;
  }
}

/** Whether this page view may be tracked at all. */
function allowed(): boolean {
  if (typeof window === "undefined") return false;
  if (!PRODUCTION_HOSTS.has(window.location.hostname)) return false;
  // A browser-level "do not sell or share" signal is honoured as an opt-out.
  if (navigator.globalPrivacyControl === true) return false;
  return true;
}

/**
 * Installs Meta's standard queueing stub, starts loading fbevents.js
 * asynchronously and initialises the pixel. Idempotent: once `window.fbq`
 * exists it does nothing, so the pixel is never initialised twice.
 */
function ensurePixel(): Fbq | null {
  if (!allowed()) return null;
  if (window.fbq) return window.fbq;

  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  } as Fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  window.fbq = fbq;
  if (!window._fbq) window._fbq = fbq;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);

  fbq("init", META_PIXEL_ID);
  return fbq;
}

function track(event: string, params?: Record<string, unknown>, eventId?: string) {
  const fbq = ensurePixel();
  if (!fbq) return;
  if (eventId) fbq("track", event, params ?? {}, { eventID: eventId });
  else if (params) fbq("track", event, params);
  else fbq("track", event);
}

export interface PixelItem {
  /** Product handle. */
  id: string;
  quantity: number;
  /** Unit price in rupees. */
  price: number;
}

function contents(items: PixelItem[]) {
  return {
    content_ids: [...new Set(items.map((i) => i.id))],
    contents: items.map((i) => ({ id: i.id, quantity: i.quantity, item_price: i.price })),
    content_type: "product",
    num_items: items.reduce((n, i) => n + i.quantity, 0),
  };
}

export function trackPixelPageView() {
  track("PageView");
}

export function trackPixelViewContent(p: { id: string; name: string; price: number; currency: string }) {
  track("ViewContent", {
    content_ids: [p.id],
    content_name: p.name,
    content_type: "product",
    value: p.price,
    currency: p.currency,
  });
}

export function trackPixelAddToCart(item: PixelItem & { name: string; currency: string }) {
  track("AddToCart", {
    ...contents([item]),
    content_name: item.name,
    value: item.price * item.quantity,
    currency: item.currency,
  });
}

export function trackPixelInitiateCheckout(items: PixelItem[], value: number, currency: string) {
  track("InitiateCheckout", { ...contents(items), value, currency });
}

const PURCHASES_KEY = "conroy.metaPixel.purchases";

/**
 * One Purchase per order. The order ID becomes the event ID (so Meta can
 * de-duplicate against any future server-side event) and is remembered on
 * this device, so the same order can never be reported twice from here.
 */
export function trackPixelPurchase(
  orderId: string | undefined,
  items: PixelItem[],
  value: number,
  currency: string,
) {
  if (!allowed()) return;
  let sent: string[] = [];
  if (orderId) {
    try {
      sent = JSON.parse(localStorage.getItem(PURCHASES_KEY) ?? "[]");
      if (!Array.isArray(sent)) sent = [];
    } catch {
      sent = [];
    }
    if (sent.includes(orderId)) return;
  }

  track("Purchase", { ...contents(items), value, currency }, orderId ? `purchase-${orderId}` : undefined);

  if (orderId) {
    try {
      localStorage.setItem(PURCHASES_KEY, JSON.stringify([...sent, orderId].slice(-50)));
    } catch {
      /* private mode — the in-page guard still prevents a repeat */
    }
  }
}

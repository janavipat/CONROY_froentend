/*
 * CONROY service worker.
 *
 * Chrome stopped requiring a service worker to install a site from the menu
 * (108 on Android), but the heuristic that actually surfaces the install
 * prompt still looks for a fetch handler — so without this file the prompt
 * never appears, however complete the manifest is.
 *
 * The handler below is deliberately narrow. An empty fetch handler added just
 * to satisfy the check is the thing Chrome called out as harmful, and caching
 * the wrong response here would be worse than no service worker at all: a
 * shopper must never be shown a stale cart, order, price or address. So only
 * same-origin GETs are touched, only build-stamped assets are served from the
 * cache, and anything to do with the API, the admin, or a customer's own data
 * goes straight to the network.
 */

const VERSION = "conroy-v1";
const ASSETS = `${VERSION}-assets`;
const PAGES = `${VERSION}-pages`;
const OFFLINE_URL = "/offline.html";

/** Never cached: responses here are specific to one shopper or one moment. */
const NEVER_CACHE = [/^\/admin/, /^\/api\//, /^\/checkout/, /^\/cart/, /^\/account/, /^\/wishlist/];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGES)
      .then((cache) => cache.addAll([OFFLINE_URL]))
      // A missing offline page must not leave the worker uninstalled; the
      // fetch handler copes with it being absent.
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only ever GET, and only ever this origin. The API lives on another host,
  // so leaving cross-origin alone keeps every order, address and payment call
  // on the network by construction rather than by a rule someone must maintain.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (NEVER_CACHE.some((p) => p.test(url.pathname))) return;

  /*
   * Build-stamped assets: the filename changes when the content does, so a hit
   * can be served from the cache without ever going stale.
   */
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(ASSETS).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
    return;
  }

  /*
   * Pages: network first, so a shopper always sees current stock and pricing.
   * The cache is only a fallback for a failed request, which is what makes the
   * app usable when the connection drops rather than showing a browser error.
   */
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(PAGES).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const offline = await caches.match(OFFLINE_URL);
          return (
            offline ??
            new Response("You are offline.", {
              status: 503,
              headers: { "Content-Type": "text/plain" },
            })
          );
        }),
    );
  }
});

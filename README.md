# CONROY — Next.js Storefront

A production-ready **Next.js (App Router) + TypeScript** reproduction of the public
fashion storefront [conroy.global](https://conroy.global) — a premium denim brand with a
"quiet luxury / old-world elegance" aesthetic.

The project replicates the live site's **UI/UX, layout, navigation, responsive behaviour,
animations, components, page hierarchy, forms, SEO and performance** characteristics using
a modern, reusable, enterprise-grade architecture.

---

## ✨ Tech Stack

| Concern | Choice |
| --- | --- |
| Framework | **Next.js 16** (App Router, RSC, Turbopack) |
| Language | **TypeScript** (strict) |
| Styling | **Tailwind CSS v4** (CSS-first `@theme` tokens) |
| Animation | **Framer Motion** |
| Forms | **React Hook Form** |
| HTTP | **Axios** (service layer) |
| Fonts | `next/font` — Cormorant Garamond (display) + Jost (sans) |
| Images | `next/image` with AVIF/WebP + Shopify CDN remote patterns |

---

## 🔍 Website Analysis (what was reproduced)

The live site is a **Shopify** storefront. Analysis of its `sitemap.xml`, page content and
product JSON endpoints produced the following map:

### Sitemap & pages

| Live page | Reproduced route |
| --- | --- |
| Home | `/` |
| Catalog (all products) | `/collections/all` |
| About us (`/pages/about-us`) | `/about` |
| Contact (`/pages/contact`) | `/contact` |
| Store Policy (`/pages/policy`) | `/policy` |
| Collection · Romano Fit Noir Classique | `/collections/romano-fit-noir-classique` |
| Collection · Romano Fit Bleu Heritage | `/collections/romano-fit-bleu-heritage` |
| 4 products (Black/Blue × Straight/Relax) | `/products/[handle]` |
| Cart / Search / Account | `/cart`, `/search`, `/account/login`, `/account/register` |

### Catalog (authentic data)

Four denim styles at **₹2,000** each, sizes **30–38**, photographed on Shopify's CDN
(referenced directly so the replica is visually faithful): Black/Blue Straight Fit,
Black/Blue Relax Fit.

### Navigation, header & footer
- **Header:** mobile menu · primary nav (Home, Catalog, About, Contact) · centered `CONROY`
  wordmark · search, account, cart actions · scroll-condensing sticky bar.
- **Announcement bar:** infinite marquee of promo messages.
- **Footer:** brand + newsletter, Shop/Company/Account link columns, contact strip,
  Instagram, legal bar.

### Forms
- **Contact form** (React Hook Form + validation) → `/api/contact`.
- **Newsletter** (footer) → `/api/newsletter`.
- **Search** (modal + dedicated page) with trending terms.
- **Auth** (login/register) UI with validation (stubbed).

### SEO metadata
Per-page titles/descriptions, canonical URLs, Open Graph + Twitter cards, JSON-LD `Product`
structured data, generated `sitemap.xml`, `robots.txt` and web manifest.

---

## 🗂 Folder Structure

```
frontend/
├── src/
│   ├── app/                     # App Router: routes, metadata, route handlers
│   │   ├── about/               # About page
│   │   ├── account/             # login / register
│   │   ├── api/                 # contact + newsletter route handlers
│   │   ├── cart/                # cart page
│   │   ├── collections/[handle] # catalog + collection pages (SSG)
│   │   ├── contact/             # contact page
│   │   ├── policy/              # store policy
│   │   ├── products/[handle]/   # product detail pages (SSG)
│   │   ├── search/              # search page
│   │   ├── layout.tsx           # root layout (fonts, header, footer, providers)
│   │   ├── page.tsx             # homepage
│   │   ├── sitemap.ts / robots.ts / manifest.ts / opengraph-image.tsx
│   │   ├── not-found.tsx / loading.tsx
│   │   └── globals.css          # Tailwind theme tokens
│   ├── components/
│   │   ├── ui/                  # primitives: Button, Modal, Accordion, Icons, …
│   │   ├── layout/              # Header, Footer, AnnouncementBar, CartDrawer, …
│   │   ├── product/             # ProductCard, ProductGrid, Gallery, QuickView, …
│   │   ├── forms/               # ContactForm, AuthForm
│   │   └── motion/              # Reveal (scroll animation wrapper)
│   ├── layouts/                 # PageHeader (shared page banner)
│   ├── sections/                # Homepage sections (Hero, Philosophy, …)
│   ├── hooks/                   # useMediaQuery, useScrollPosition, useLockBodyScroll
│   ├── lib/                     # site config, product data, cart context
│   ├── services/                # Axios instance + contact/newsletter services
│   ├── utils/                   # cn(), formatting helpers
│   ├── types/                   # shared TypeScript types
│   └── assets/                  # static design assets
├── public/
├── next.config.ts               # image remote patterns, perf flags
└── package.json
```

---

## 🧱 Component Architecture

- **Primitives (`components/ui`)** — stateless, reusable building blocks (`Button`, `Modal`,
  `Accordion`, `Rating`, `Container`, `SectionHeading`, `Icons`). No business logic.
- **Layout (`components/layout`)** — global chrome: `Header`, `Footer`, `AnnouncementBar`,
  `CartDrawer`, `SearchModal`, `MobileNav`, `NewsletterForm`.
- **Product (`components/product`)** — `ProductCard` (hover image-swap + Quick View),
  `ProductGrid`, `ProductGallery`, `QuickViewModal`, `AddToCartForm` (shared by Quick View
  and the PDP).
- **Sections (`sections`)** — composable homepage blocks (`Hero`, `CollectionShowcase`,
  `FeaturedProducts`, `Philosophy`, `ServiceFeatures`, `Testimonials`, `InstagramFeed`,
  `CTASection`).
- **State** — `CartProvider` (`lib/cart-context.tsx`) holds cart state in React Context,
  persisted to `localStorage`, hydration-safe to avoid SSR mismatches.
- **Server vs Client** — pages and content are **Server Components** by default; only
  interactive pieces (cart, forms, modals, animations) are `"use client"`.

---

## 🚀 Getting Started

### Prerequisites
- Node.js **18.18+** (tested on Node 22)
- npm

### Installation

```bash
cd frontend
npm install
cp .env.example .env.local   # optional; sensible defaults are built in
```

### Development

```bash
npm run dev
# http://localhost:3000
```

### Production build

```bash
npm run build   # type-checks + builds (SSG for products & collections)
npm run start   # serve the production build
```

### Lint

```bash
npm run lint
```

---

## ☁️ Deployment

The app is a standard Next.js project and deploys anywhere Next 16 is supported.

**Vercel (recommended):**
1. Push the repo to GitHub/GitLab.
2. Import the project in Vercel; set the **root directory** to `frontend`.
3. Set `NEXT_PUBLIC_SITE_URL` to your production domain.
4. Deploy — products/collections are pre-rendered (SSG); the OG image and route handlers
   run as serverless functions.

**Self-hosted / Docker / Node:** run `npm run build` then `npm run start` behind a reverse
proxy. The `cdn.shopify.com` image host is already allow-listed in `next.config.ts`.

---

## 🔎 SEO

- **Metadata API** — root template + per-page `generateMetadata` (titles, descriptions,
  canonicals).
- **Open Graph & Twitter cards** — site-wide defaults + dynamic per-product images, plus a
  generated `/opengraph-image`.
- **Structured data** — JSON-LD `Product` schema with price, availability and ratings on PDPs.
- **Sitemap & robots** — programmatic `sitemap.xml` (static + collection + product routes)
  and `robots.txt`; private routes (`/cart`, `/account`, `/api`) disallowed.
- **Web manifest** — installable PWA metadata + theme colour.

## ⚡ Performance

- `next/image` with **AVIF/WebP**, responsive `sizes`, priority hints above the fold and
  lazy loading below.
- **SSG** for product and collection pages via `generateStaticParams`.
- **Code splitting** — below-the-fold homepage sections loaded via `next/dynamic`.
- Server Components keep the client bundle minimal; only interactive leaves ship JS.
- `prefers-reduced-motion` respected; fonts use `display: swap`.

---

## ⚠️ Assumptions & Limitations

1. **No live backend.** The real site runs on Shopify. Cart, checkout, auth, contact and
   newsletter are implemented as faithful **UI + stubbed services** (`/api/*` route handlers
   acknowledge submissions). Wire these to a real provider (Shopify Storefront API, Resend,
   etc.) for production commerce.
2. **Catalog is static.** The four products and two collections live in `lib/products.ts`,
   reconstructed from the public product pages/JSON. Swap this module for a CMS/API to make
   it dynamic — selectors (`getProductByHandle`, etc.) keep the rest of the app unchanged.
3. **Imagery is referenced from Shopify's CDN** so the replica matches the live photography.
   For full independence, download the assets into `public/` and update `lib/products.ts`.
4. **Copy is reconstructed**, not byte-for-byte scraped — long-form text mirrors the live
   site's tone and structure (e.g. About, Policy) and may differ in exact wording.
5. **Design tokens are inferred.** A markdown crawl strips styling, so colours, fonts and
   spacing were chosen to match the brand's quiet-luxury aesthetic (warm paper palette,
   editorial serif). Adjust tokens in `globals.css` to fine-tune.
6. **Pixel parity is approximate.** The goal is a faithful, responsive, production-grade
   reproduction of structure and experience rather than an exact clone.

---

Built with Next.js, TypeScript, Tailwind CSS, Framer Motion, React Hook Form and Axios.

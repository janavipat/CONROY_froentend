"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PRIMARY_NAV, SITE } from "@/lib/site";
import { api } from "@/services/api";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth/auth-context";
import { useWishlist } from "@/lib/wishlist-context";
import { useScrollPosition } from "@/hooks/useScrollPosition";
import { cn } from "@/utils/cn";
import { Container } from "@/components/ui/Container";
import { BagIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from "@/components/ui/Icons";
import { SearchModal } from "./SearchModal";
import { MobileNav } from "./MobileNav";
import { NewInMenu, NEW_IN_MENU_LIMIT, type NewInItem } from "./NewInMenu";
import { CollectionsMenu, type ProductTypeImages } from "./CollectionsMenu";

/**
 * First name only — a full name would crowd the navbar. Accounts created
 * before names were collected fall back to a neutral label.
 */
function firstName(name?: string | null): string {
  const first = (name ?? "").trim().split(/\s+/)[0];
  return first || "My Account";
}

/** The catalogue fields the header's panels read. Everything else is ignored. */
interface NavProduct {
  handle: string;
  title: string;
  price?: number;
  currency?: string;
  isNewIn?: boolean;
  newInOrder?: number;
  productType?: string;
  status?: string;
  images?: { src: string; alt?: string }[];
}

export function Header() {
  const pathname = usePathname();
  const scrolled = useScrollPosition(20);
  const { count, openCart } = useCart();
  const { user } = useAuth();
  const { count: wishlistCount } = useWishlist();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  /** Which dropdown is open, by label. Null means none. */
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  /** Products marked New In, in `newInOrder` — the New In dropdown's contents. */
  const [newIn, setNewIn] = useState<NewInItem[]>([]);
  /** One photograph per product type, for the Collections panel. */
  const [typeImages, setTypeImages] = useState<ProductTypeImages>({});

  // Both panels are filled from the live catalogue rather than a static list:
  // New In is admin-curated (isNewIn / newInOrder), and the Collections panel
  // shows the first real photograph of each product type. One request serves
  // both, made up front so a panel is already populated on first hover.
  useEffect(() => {
    let active = true;
    void fetch(`${api.defaults.baseURL ?? ""}/products`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!active || !j?.data) return;
        const products = (j.data as NavProduct[]).filter(
          (p) => (p.status ?? "active") === "active",
        );

        setNewIn(
          products
            .filter((p) => p.isNewIn)
            // Products without an explicit order sort last, keeping it stable.
            .sort((a, b) => (a.newInOrder ?? Infinity) - (b.newInOrder ?? Infinity))
            .slice(0, NEW_IN_MENU_LIMIT)
            .map((p) => ({
              handle: p.handle,
              title: p.title,
              image: p.images?.[0]?.src,
              price: Number(p.price ?? 0),
              currency: p.currency ?? "INR",
            })),
        );

        // First product of each type that actually has a photograph wins.
        const images: ProductTypeImages = {};
        for (const p of products) {
          const type = p.productType?.trim();
          const first = p.images?.[0];
          if (!type || !first?.src || images[type]) continue;
          images[type] = { src: first.src, alt: first.alt || p.title };
        }
        setTypeImages(images);
      })
      .catch(() => {
        /* New In falls back to its invitation copy, Collections to the brand
           still-life — neither panel depends on the request succeeding */
      });
    return () => {
      active = false;
    };
  }, []);

  // A click-opened panel has no pointer to leave, so Escape is its way out.
  useEffect(() => {
    if (!openMenu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenMenu(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openMenu]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-all duration-300 ease-[var(--ease-luxe)]",
          scrolled
            ? "border-line bg-background/95 backdrop-blur-md"
            : "border-transparent bg-background",
        )}
      >
        {/*
         * Logo → navigation → actions, reading left to right. The wordmark was
         * previously centred between three flex-1 columns, but the nav column
         * is much wider than the actions column, so the "centre" landed well
         * right of the page centre. Anchoring it to the container's left gutter
         * removes the drift and gives the same alignment at every breakpoint.
         */}
        <Container className="flex h-[var(--spacing-header)] items-center gap-2 sm:gap-4">
          {/* Menu — below xl the primary nav lives in the drawer. Pulled left by
              the icon's own padding so its glyph lines up with the gutter. */}
          <button
            className="-ml-1.5 grid h-9 w-9 shrink-0 place-items-center text-ink xl:hidden"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <MenuIcon className="h-6 w-6" />
          </button>

          {/* Wordmark — flush with the content container's left edge. */}
          <Link
            href="/"
            className="shrink-0 font-display text-[1.375rem] leading-none tracking-[0.28em] text-ink sm:text-[1.625rem] lg:text-[1.75rem] xl:text-[2rem]"
            aria-label={`${SITE.name} home`}
          >
            {SITE.name}
          </Link>

          {/* Primary navigation, sitting beside the wordmark. Shown from xl:
              below that the six labels plus the wordmark and actions overflow
              the container, which is what pushed the header off its gutters. */}
          <nav className="ml-10 hidden shrink-0 items-center gap-7 xl:flex">
            {PRIMARY_NAV.map((item) => {
              const children = item.children ?? [];
              const isMega = Boolean(item.mega);
              const hasMenu = isMega || children.length > 0;
              const isOpen = openMenu === item.label;

              return (
                <div
                  key={item.href + item.label}
                  className="relative"
                  onMouseEnter={() => hasMenu && setOpenMenu(item.label)}
                  onMouseLeave={() => setOpenMenu(null)}
                >
                  <Link
                    href={item.href}
                    // Closes the menu after a keyboard user follows a link.
                    onFocus={() => hasMenu && setOpenMenu(item.label)}
                    onClick={(e) => {
                      // A mega-menu opens on click as well as hover. The first
                      // click reveals the panel (so touch and click-first users
                      // see it at all); a second click follows the link.
                      if (isMega && !isOpen) {
                        e.preventDefault();
                        setOpenMenu(item.label);
                      } else {
                        setOpenMenu(null);
                      }
                    }}
                    aria-expanded={hasMenu ? isOpen : undefined}
                    className={cn(
                      // whitespace-nowrap: a two-word label like "Shop the
                      // Look" would otherwise wrap as the nav tightens.
                      "nav-label relative whitespace-nowrap text-ink transition-colors duration-(--duration-base) hover:text-accent",
                      "after:absolute after:-bottom-2 after:left-0 after:h-px after:bg-accent after:transition-all after:duration-300",
                      isActive(item.href) ? "text-accent after:w-full" : "after:w-0 hover:after:w-full",
                    )}
                  >
                    {item.label}
                  </Link>

                  {hasMenu && isOpen && (
                    // Sits in the gap under the link so moving the cursor
                    // down doesn't cross a dead zone and close it.
                    <div className="absolute left-0 top-full z-50 pt-4">
                      {item.mega === "newIn" ? (
                        <NewInMenu products={newIn} onNavigate={() => setOpenMenu(null)} />
                      ) : item.mega === "productTypes" ? (
                        <CollectionsMenu
                          images={typeImages}
                          onNavigate={() => setOpenMenu(null)}
                        />
                      ) : (
                        <ul className="min-w-48 border border-line bg-white py-2">
                          {children.map((child) => (
                            <li key={child.href + child.label}>
                              <Link
                                href={child.href}
                                onClick={() => setOpenMenu(null)}
                                className="block whitespace-nowrap px-5 py-2 text-sm text-ink-soft transition-colors duration-(--duration-quick) hover:text-ink"
                              >
                                {child.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="ml-auto flex shrink-0 items-center justify-end gap-0 sm:gap-1">
            <button
              className="grid h-9 w-9 place-items-center text-ink transition-colors duration-(--duration-quick) hover:text-accent sm:h-10 sm:w-10"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <SearchIcon className="h-5 w-5" />
            </button>
            {/* Account entry point. The icon alone read as decoration, so from
                `sm` up it becomes a labelled control. Mobile keeps the bare
                icon to match Search/Cart and save room. */}
            <Link
              href={user ? "/account/profile" : "/account/login"}
              aria-label={user ? "My account" : "Login"}
              className={cn(
                // Mobile: same icon-button treatment as its siblings.
                "grid h-9 w-9 place-items-center text-ink transition-colors duration-(--duration-quick) hover:text-accent",
                // sm+: a squared, hairline-outlined label — quiet, not a CTA.
                // No radius, no lift, no shadow: it matches the button system.
                "sm:inline-flex sm:h-9 sm:w-auto sm:gap-2 sm:border sm:border-line sm:px-3.5",
                "sm:text-[0.75rem] sm:font-medium sm:uppercase sm:tracking-[0.14em]",
                "sm:transition-colors sm:duration-(--duration-base) sm:hover:border-ink sm:hover:text-ink",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              )}
            >
              <UserIcon className="h-5 w-5 shrink-0 sm:h-4 sm:w-4" />
              <span className="hidden max-w-[10ch] truncate sm:inline">
                {user ? firstName(user.name) : "Login"}
              </span>
            </Link>
            <Link
              href="/wishlist"
              aria-label={`Wishlist, ${wishlistCount} saved`}
              className="relative grid h-9 w-9 place-items-center text-ink transition-colors duration-(--duration-quick) hover:text-accent sm:h-10 sm:w-10"
            >
              <HeartIcon className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[0.6rem] font-medium text-white">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <button
              className="relative grid h-9 w-9 place-items-center text-ink transition-colors duration-(--duration-quick) hover:text-accent sm:h-10 sm:w-10"
              aria-label={`Cart, ${count} items`}
              onClick={openCart}
            >
              <BagIcon className="h-5 w-5" />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[0.6rem] font-medium text-white"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </Container>
      </header>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

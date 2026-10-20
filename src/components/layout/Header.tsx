"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SHOP_MENU, PRIMARY_NAV, SITE, type NavItem } from "@/lib/site";
import { api } from "@/services/api";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth/auth-context";
import { useWishlist } from "@/lib/wishlist-context";
import { useScrollPosition } from "@/hooks/useScrollPosition";
import { cn } from "@/utils/cn";
import { Container } from "@/components/ui/Container";
import {
  BagIcon,
  ChevronDownIcon,
  HeartIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
} from "@/components/ui/Icons";
import { SearchModal } from "./SearchModal";
import { MobileNav } from "./MobileNav";
import { NewInMenu, NEW_IN_MENU_LIMIT, type NewInItem } from "./NewInMenu";
import { CollectionsMenu, type ProductTypeImages } from "./CollectionsMenu";
import { ShopMenu, type ShopImages } from "./ShopMenu";

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

const SHOP_MENU_ID = "shop-menu";

/**
 * Grace period before a hover-opened menu closes once the pointer leaves the
 * header — long enough that a slightly wayward path from SHOP down into the
 * panel doesn't snap it shut.
 */
const CLOSE_DELAY_MS = 180;

/** Shared look for the icon buttons in the logo row. */
const ICON_BUTTON =
  "relative grid h-10 w-10 place-items-center text-ink transition-colors duration-(--duration-quick) hover:text-accent " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const BADGE =
  "absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[0.6rem] font-medium text-white";

/**
 * One photograph per Shop column: the first product of the column's type that
 * has one, preferring active products.
 */
function shopImagesFrom(products: NavProduct[]): ShopImages {
  const images: ShopImages = {};
  const isActive = (p: NavProduct) => (p.status ?? "active") === "active";

  for (const group of SHOP_MENU) {
    const ofType = products.filter((p) => p.productType === group.productType && p.images?.[0]?.src);
    const pick = ofType.find(isActive) ?? ofType[0];
    if (!pick) continue;
    const first = pick.images![0];
    images[group.href] = { src: first.src, alt: first.alt || pick.title };
  }
  return images;
}

export function Header() {
  const pathname = usePathname();
  const scrolled = useScrollPosition(20);
  const { count, openCart } = useCart();
  const { user } = useAuth();
  const { count: wishlistCount } = useWishlist();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  /**
   * Which dropdown is open, and on which page. Tying it to the path means a
   * navigation — by link, back button or anything else — closes it without an
   * effect having to notice.
   */
  const [openMenu, setOpenMenu] = useState<{ label: string; path: string } | null>(null);
  /** Products marked New In, in `newInOrder` — the New In dropdown's contents. */
  const [newIn, setNewIn] = useState<NewInItem[]>([]);
  /** One photograph per product type, for the Collections panel. */
  const [typeImages, setTypeImages] = useState<ProductTypeImages>({});
  /** One photograph per Shop column. */
  const [shopImages, setShopImages] = useState<ShopImages>({});
  const shopButtonRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);

  const openLabel = openMenu?.path === pathname ? openMenu.label : null;
  const cancelClose = () => window.clearTimeout(closeTimer.current);
  const open = (label: string) => {
    cancelClose();
    setOpenMenu({ label, path: pathname });
  };
  const close = () => {
    cancelClose();
    setOpenMenu(null);
  };
  /** The pointer left the header: close after a short grace period. */
  const closeSoon = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpenMenu(null), CLOSE_DELAY_MS);
  };
  /**
   * Hover only means "open" for a real mouse. A tap on a touch screen fires
   * pointer-enter and click together, which would open and instantly close.
   */
  const onHover = (label: string | null) => (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    if (label) open(label);
    else close();
  };

  // All three panels are filled from the live catalogue rather than a static
  // list, in one request made up front so a panel is populated on first hover.
  useEffect(() => {
    let active = true;
    void fetch(`${api.defaults.baseURL ?? ""}/products`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!active || !j?.data) return;
        const all = j.data as NavProduct[];
        const products = all.filter((p) => (p.status ?? "active") === "active");

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
        setShopImages(shopImagesFrom(all));
      })
      .catch(() => {
        /* Every panel has a fallback — none depends on the request succeeding */
      });
    return () => {
      active = false;
    };
  }, []);

  // While a panel is open: Escape closes it (handing focus back to SHOP if it
  // was inside the Shop menu), and a click or tap outside the header closes it.
  useEffect(() => {
    if (!openLabel) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const inShop = document.getElementById(SHOP_MENU_ID)?.contains(document.activeElement);
      setOpenMenu(null);
      if (inShop) shopButtonRef.current?.focus();
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setOpenMenu(null);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [openLabel]);

  // Never leave a pending close running after the header unmounts.
  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  const pathMatches = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  const isActive = (item: NavItem) => {
    // Shop lights up for its categories unless another top-level item (Denim)
    // already claims the page, so only one item is ever underlined.
    if (item.groups) {
      const claimed = PRIMARY_NAV.some((other) => !other.groups && pathMatches(other.href));
      return !claimed && item.groups.some((g) => pathMatches(g.href));
    }
    return pathMatches(item.href);
  };

  const labelClass = (active: boolean) =>
    cn(
      // whitespace-nowrap: "Shop the Look" would otherwise wrap.
      "nav-label relative inline-flex items-center gap-1.5 whitespace-nowrap text-ink transition-colors duration-(--duration-base) hover:text-accent",
      "after:absolute after:-bottom-1.5 after:left-0 after:h-px after:bg-ink after:transition-all after:duration-300",
      active ? "after:w-full" : "after:w-0 hover:after:w-full",
    );

  return (
    <>
      <header
        ref={headerRef}
        // Leaving the header (logo row, navigation and any open panel) closes
        // the menus after a short grace period; moving between them does not.
        onPointerLeave={(e) => e.pointerType === "mouse" && closeSoon()}
        onPointerEnter={cancelClose}
        // Tabbing out of the header closes them too.
        onBlur={(e) => {
          if (!headerRef.current?.contains(e.relatedTarget as Node | null)) close();
        }}
        className={cn(
          "sticky top-0 z-50 border-b bg-ivory transition-colors duration-300 ease-[var(--ease-luxe)]",
          scrolled || openLabel ? "border-line" : "border-transparent",
        )}
      >
        {/* Logo row — search left, wordmark centred, account actions right.
            Equal outer columns keep the wordmark on the true page centre. */}
        <Container className="grid h-[var(--spacing-header)] grid-cols-[1fr_auto_1fr] items-center xl:h-16">
          <div className="flex items-center gap-0.5">
            {/* Below xl the navigation lives in the drawer. */}
            <button
              className={cn(ICON_BUTTON, "-ml-2 xl:hidden")}
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
            >
              <MenuIcon className="h-6 w-6" />
            </button>
            <button
              className={cn(ICON_BUTTON, "xl:-ml-2")}
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <SearchIcon className="h-5 w-5" />
            </button>
          </div>

          <Link
            href="/"
            /* Wide tracking makes the wordmark ~135px; it steps down below
               360px so the row still fits a 320px screen. */
            className="font-display text-[1.05rem] leading-none tracking-[0.18em] text-ink min-[360px]:text-[1.375rem] min-[360px]:tracking-[0.28em] sm:text-[1.625rem] xl:text-[1.875rem]"
            aria-label={`${SITE.name} home`}
          >
            {SITE.name}
          </Link>

          <div className="-mr-2 flex items-center justify-end gap-0.5">
            <Link
              href={user ? "/account/profile" : "/account/login"}
              aria-label={user ? "My account" : "Login"}
              className={ICON_BUTTON}
            >
              <UserIcon className="h-5 w-5" />
            </Link>
            {/* Wishlist moves into the drawer on the smallest screens. */}
            <Link
              href="/wishlist"
              aria-label={`Wishlist, ${wishlistCount} saved`}
              className={cn(ICON_BUTTON, "hidden min-[400px]:grid")}
            >
              <HeartIcon className="h-5 w-5" />
              {wishlistCount > 0 && <span className={BADGE}>{wishlistCount}</span>}
            </Link>
            <button className={ICON_BUTTON} aria-label={`Cart, ${count} items`} onClick={openCart}>
              <BagIcon className="h-5 w-5" />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    className={BADGE}
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </Container>

        {/* Navigation row — centred under the wordmark, from xl. */}
        <nav aria-label="Primary" className="hidden xl:block">
          <Container className="flex h-11 items-center justify-center gap-11">
            {PRIMARY_NAV.map((item) => {
              const isOpen = openLabel === item.label;

              // Shop: a disclosure button over a full-width panel. The wrapper
              // is deliberately not positioned, so the panel anchors to the
              // header and spans it edge to edge. Moving from the button down
              // into the panel never leaves the header, so it stays open.
              if (item.mega === "shop" && item.groups) {
                return (
                  <div key={item.label} onPointerEnter={onHover(item.label)}>
                    <button
                      ref={shopButtonRef}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={SHOP_MENU_ID}
                      onClick={() => (isOpen ? close() : open(item.label))}
                      className={labelClass(isActive(item) || isOpen)}
                    >
                      {item.label}
                      <ChevronDownIcon
                        aria-hidden
                        className={cn(
                          "h-3 w-3 transition-transform duration-(--duration-base)",
                          isOpen && "rotate-180",
                        )}
                      />
                    </button>
                    {isOpen && (
                      <div className="absolute inset-x-0 top-full">
                        <ShopMenu
                          id={SHOP_MENU_ID}
                          groups={item.groups}
                          images={shopImages}
                          onNavigate={close}
                        />
                      </div>
                    )}
                  </div>
                );
              }

              const children = item.children ?? [];
              const isMega = Boolean(item.mega);
              const hasMenu = isMega || children.length > 0;

              return (
                <div
                  key={item.href + item.label}
                  className="relative"
                  onPointerEnter={onHover(hasMenu ? item.label : null)}
                  onPointerLeave={(e) => e.pointerType === "mouse" && hasMenu && closeSoon()}
                >
                  <Link
                    href={item.href}
                    onFocus={() => (hasMenu ? open(item.label) : close())}
                    onClick={(e) => {
                      // A mega-menu opens on click as well as hover: the first
                      // click reveals the panel, a second follows the link.
                      if (isMega && !isOpen) {
                        e.preventDefault();
                        open(item.label);
                      } else {
                        close();
                      }
                    }}
                    aria-expanded={hasMenu ? isOpen : undefined}
                    className={labelClass(isActive(item))}
                  >
                    {item.label}
                  </Link>

                  {hasMenu && isOpen && (
                    // Sits in the gap under the link so moving the cursor down
                    // doesn't cross a dead zone and close it.
                    <div className="absolute left-0 top-full z-50 pt-3">
                      {item.mega === "newIn" ? (
                        <NewInMenu products={newIn} onNavigate={close} />
                      ) : item.mega === "productTypes" ? (
                        <CollectionsMenu images={typeImages} onNavigate={close} />
                      ) : (
                        <ul className="min-w-48 border border-line bg-ivory py-2">
                          {children.map((child) => (
                            <li key={child.href + child.label}>
                              <Link
                                href={child.href}
                                onClick={close}
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
          </Container>
        </nav>
      </header>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

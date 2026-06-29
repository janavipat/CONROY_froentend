"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { PRIMARY_NAV, SITE } from "@/lib/site";
import { useCart } from "@/lib/cart-context";
import { useScrollPosition } from "@/hooks/useScrollPosition";
import { cn } from "@/utils/cn";
import { Container } from "@/components/ui/Container";
import { BagIcon, MenuIcon, SearchIcon, UserIcon } from "@/components/ui/Icons";
import { SearchModal } from "./SearchModal";
import { MobileNav } from "./MobileNav";

export function Header() {
  const pathname = usePathname();
  const scrolled = useScrollPosition(20);
  const { count, openCart } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-all duration-300 ease-[var(--ease-luxe)]",
          scrolled
            ? "border-line bg-white/95 backdrop-blur-md"
            : "border-line/60 bg-white",
        )}
      >
        <Container className="flex h-[var(--spacing-header)] items-center justify-between gap-4">
          {/* Left: mobile menu + desktop nav */}
          <div className="flex items-center gap-6 lg:flex-1">
            <button
              className="grid h-9 w-9 place-items-center text-ink lg:hidden"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
            >
              <MenuIcon className="h-6 w-6" />
            </button>
            <nav className="hidden items-center gap-8 lg:flex">
              {PRIMARY_NAV.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative text-sm text-ink-soft transition-colors hover:text-ink",
                    "after:absolute after:-bottom-1.5 after:left-0 after:h-px after:bg-ink after:transition-all after:duration-300",
                    isActive(link.href) ? "text-ink after:w-full" : "after:w-0 hover:after:w-full",
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Center: wordmark */}
          <Link
            href="/"
            className="font-display text-2xl font-semibold tracking-[0.14em] text-ink sm:text-[1.6rem] lg:flex-1 lg:text-center"
            aria-label={`${SITE.name} home`}
          >
            {SITE.name}
          </Link>

          {/* Right: actions */}
          <div className="flex items-center justify-end gap-1 sm:gap-2 lg:flex-1">
            <button
              className="grid h-9 w-9 place-items-center text-ink transition-colors hover:text-accent"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <SearchIcon className="h-5 w-5" />
            </button>
            <Link
              href="/account/login"
              className="hidden h-9 w-9 place-items-center text-ink transition-colors hover:text-accent sm:grid"
              aria-label="Account"
            >
              <UserIcon className="h-5 w-5" />
            </Link>
            <button
              className="relative grid h-9 w-9 place-items-center text-ink transition-colors hover:text-accent"
              aria-label={`Cart, ${count} items`}
              onClick={openCart}
            >
              <BagIcon className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-ink px-1 text-[0.6rem] font-medium text-white">
                  {count}
                </span>
              )}
            </button>
          </div>
        </Container>
      </header>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PRIMARY_NAV, SITE } from "@/lib/site";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth/auth-context";
import { useScrollPosition } from "@/hooks/useScrollPosition";
import { cn } from "@/utils/cn";
import { Container } from "@/components/ui/Container";
import { BagIcon, MenuIcon, SearchIcon, UserIcon } from "@/components/ui/Icons";
import { SearchModal } from "./SearchModal";
import { MobileNav } from "./MobileNav";

/**
 * First name only — a full name would crowd the navbar. Accounts created
 * before names were collected fall back to a neutral label.
 */
function firstName(name?: string | null): string {
  const first = (name ?? "").trim().split(/\s+/)[0];
  return first || "My Account";
}

export function Header() {
  const pathname = usePathname();
  const scrolled = useScrollPosition(20);
  const { count, openCart } = useCart();
  const { user } = useAuth();
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
          <div className="flex items-center justify-end gap-0.5 sm:gap-1 lg:flex-1">
            <button
              className="grid h-10 w-10 place-items-center rounded-full text-ink transition-colors hover:bg-mist"
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
                "grid h-10 w-10 place-items-center rounded-full text-ink transition-colors hover:bg-mist",
                // sm+: an outlined, labelled control — quiet, not a CTA.
                "sm:inline-flex sm:h-[38px] sm:w-auto sm:gap-2 sm:rounded-[10px] sm:border sm:border-[#E5E7EB] sm:bg-white sm:px-[14px] sm:text-sm sm:font-medium",
                "sm:transition-all sm:duration-200 sm:hover:-translate-y-px sm:hover:border-[#D1D5DB] sm:hover:bg-[#FAFAFA] sm:hover:shadow-sm",
                "sm:active:translate-y-0 sm:active:border-[#CBD5E1] sm:active:bg-[#F9FAFB]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/25 focus-visible:ring-offset-2",
              )}
            >
              <UserIcon className="h-5 w-5 shrink-0 text-ink-soft sm:h-[18px] sm:w-[18px]" />
              <span className="hidden max-w-[10ch] truncate sm:inline">
                {user ? firstName(user.name) : "Login"}
              </span>
            </Link>
            <button
              className="relative grid h-10 w-10 place-items-center rounded-full text-ink transition-colors hover:bg-mist"
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

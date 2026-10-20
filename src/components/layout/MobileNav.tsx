"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { PRIMARY_NAV, SITE } from "@/lib/site";
import { Modal } from "@/components/ui/Modal";
import { ArrowRightIcon, InstagramIcon, BagIcon } from "@/components/ui/Icons";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/utils/cn";

export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  /** Which section is expanded, by label. One at a time keeps it scannable. */
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <Modal open={open} onClose={onClose} position="right" label="Menu" className="h-full w-[86vw] max-w-sm">
      <div className="flex h-full flex-col px-7 pb-8 pt-7">
        <span className="font-display text-xl tracking-[0.3em] text-ink">{SITE.name}</span>

        <nav className="mt-10 flex flex-col">
          {PRIMARY_NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const children = item.children ?? [];
            const expandable = children.length > 0;
            const isOpen = expanded === item.label;

            // A section with children expands in place rather than navigating,
            // so the whole hierarchy stays reachable with one thumb.
            if (expandable) {
              return (
                <div key={item.label} className="border-b border-line">
                  <button
                    onClick={() => setExpanded(isOpen ? null : item.label)}
                    aria-expanded={isOpen}
                    className={cn(
                      // Navigation is sans everywhere, drawer included: Bodoni's
                      // hairlines start to break up below display sizes.
                      "flex w-full items-center justify-between py-4 text-left text-[0.875rem] font-medium uppercase tracking-[0.18em] text-ink",
                      active && "text-accent",
                    )}
                  >
                    {item.label}
                    <span
                      aria-hidden
                      className={cn(
                        "text-lg transition-transform duration-(--duration-base)",
                        isOpen && "rotate-45",
                      )}
                    >
                      +
                    </span>
                  </button>

                  {isOpen && (
                    <ul className="pb-4 pl-1">
                      {children.map((child) => (
                        <li key={child.href + child.label}>
                          <Link
                            href={child.href}
                            onClick={onClose}
                            className="block py-2.5 text-base text-ink-soft"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group flex items-center justify-between border-b border-line py-4 text-[0.875rem] font-medium uppercase tracking-[0.18em] text-ink",
                  active && "text-accent",
                )}
              >
                {item.label}
                <ArrowRightIcon className="h-5 w-5 -translate-x-1 opacity-0 transition-all duration-(--duration-base) group-hover:translate-x-0 group-hover:opacity-100" />
              </Link>
            );
          })}
        </nav>

        {/* Account · Wishlist · Bag — the same actions as the desktop header. */}
        <div className="mt-6 flex flex-col">
          {[
            { label: "Account", href: user ? "/account/profile" : "/account/login" },
            { label: "Wishlist", href: "/wishlist" },
            { label: "Bag", href: "/cart" },
          ].map((a) => (
            <Link
              key={a.label}
              href={a.href}
              onClick={onClose}
              className="border-b border-line py-3 text-sm text-ink-soft"
            >
              {a.label}
            </Link>
          ))}
        </div>

        {/* Account: signed-in customers get a direct path to their orders + returns */}
        {user ? (
          <Link
            href="/account/profile#orders"
            onClick={onClose}
            className="mt-8 flex items-center justify-between rounded-md border border-line px-4 py-3 text-sm font-medium text-ink transition-colors hover:border-ink"
          >
            <span className="inline-flex items-center gap-2">
              <BagIcon className="h-4.5 w-4.5" />
              My orders &amp; returns
            </span>
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        ) : null}

        <div className="mt-auto space-y-3 text-sm text-ink-soft">
          <Link
            href={user ? "/account/profile" : "/account/login"}
            onClick={onClose}
            className="block hover:text-ink"
          >
            {user ? "My account" : "Login / Register"}
          </Link>
          <a href={SITE.contact.phoneHref} className="block hover:text-ink">
            {SITE.contact.phone}
          </a>
          <a href={`mailto:${SITE.contact.email}`} className="block hover:text-ink">
            {SITE.contact.email}
          </a>
          <a
            href={SITE.social.instagram}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 pt-2 text-ink hover:text-stone"
          >
            <InstagramIcon className="h-5 w-5" />
            {SITE.social.instagramHandle}
          </a>
        </div>
      </div>
    </Modal>
  );
}

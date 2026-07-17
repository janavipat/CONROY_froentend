"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRIMARY_NAV, SITE } from "@/lib/site";
import { Modal } from "@/components/ui/Modal";
import { ArrowRightIcon, InstagramIcon, BagIcon } from "@/components/ui/Icons";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/utils/cn";

export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <Modal open={open} onClose={onClose} position="right" label="Menu" className="h-full w-[86vw] max-w-sm">
      <div className="flex h-full flex-col px-7 pb-8 pt-7">
        <span className="font-display text-xl tracking-[0.3em] text-ink">{SITE.name}</span>

        <nav className="mt-10 flex flex-col">
          {PRIMARY_NAV.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={cn(
                  "group flex items-center justify-between border-b border-line py-4 font-display text-2xl text-ink",
                  active && "text-stone",
                )}
              >
                {link.label}
                <ArrowRightIcon className="h-5 w-5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
              </Link>
            );
          })}
        </nav>

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

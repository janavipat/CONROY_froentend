"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";
import { clearAdminKey } from "@/lib/admin-auth";
import {
  BagIcon,
  ArrowRightIcon,
  TruckIcon,
  UserIcon,
  GridIcon,
  ChartIcon,
  MegaphoneIcon,
  TagIcon,
  CogIcon,
  HeadsetIcon,
} from "@/components/ui/Icons";

interface NavChild {
  label: string;
  href: string;
}
interface NavItem {
  label: string;
  href: string;
  icon: typeof GridIcon;
  children?: NavChild[];
}

// Shopify-style information architecture: top-level sections with sub-items.
const NAV: NavItem[] = [
  { label: "Home", href: "/admin", icon: GridIcon },
  {
    label: "Orders",
    href: "/admin/orders",
    icon: TruckIcon,
    children: [
      { label: "Returns", href: "/admin/returns" },
      { label: "Abandoned checkouts", href: "/admin/orders/abandoned" },
    ],
  },
  {
    label: "Products",
    href: "/admin/products",
    icon: BagIcon,
    children: [
      { label: "Collections", href: "/admin/collections" },
      { label: "Inventory", href: "/admin/inventory" },
    ],
  },
  { label: "Customers", href: "/admin/customers", icon: UserIcon },
  { label: "Messages", href: "/admin/contacts", icon: HeadsetIcon },
  { label: "Marketing", href: "/admin/marketing", icon: MegaphoneIcon },
  { label: "Discounts", href: "/admin/offers", icon: TagIcon },
  { label: "Analytics", href: "/admin/analytics", icon: ChartIcon },
];

// Pinned at the very bottom, like Shopify's Settings.
const SETTINGS_ITEM = { label: "Settings", href: "/admin/settings", icon: CogIcon };

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  // "/admin" must match exactly, else it'd highlight for every sub-route.
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  function logout() {
    clearAdminKey();
    router.replace("/admin/login");
  }

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-white md:flex">
      <div className="flex h-16 items-center border-b border-line px-6">
        <Link href="/admin" className="font-display text-lg font-semibold tracking-[0.14em] text-ink">
          CONROY
        </Link>
        <span className="ml-2 rounded-full bg-mist px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-stone">
          Admin
        </span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {NAV.map((item) => {
          const active = isActive(item.href);
          const childActive = item.children?.some((c) => isActive(c.href)) ?? false;
          const sectionOpen = active || childActive;

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                  active ? "text-white" : "text-ink-soft hover:bg-mist hover:text-ink",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="adminActivePill"
                    className="absolute inset-0 rounded-md bg-ink"
                    transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  />
                )}
                <item.icon className="relative z-10 h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-110" />
                <span className="relative z-10">{item.label}</span>
              </Link>

              {/* Sub-items (e.g. Returns under Orders) — shown when the section is active */}
              {item.children && sectionOpen && (
                <div className="mt-0.5 space-y-0.5">
                  {item.children.map((child) => {
                    const cActive = isActive(child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "relative ml-[1.35rem] flex items-center rounded-md border-l border-line py-2 pl-4 pr-3 text-sm transition-colors",
                          cActive
                            ? "border-ink font-medium text-ink"
                            : "text-stone hover:text-ink",
                        )}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="m-3 space-y-2">
        <Link
          href={SETTINGS_ITEM.href}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
            isActive(SETTINGS_ITEM.href)
              ? "bg-ink text-white"
              : "text-ink-soft hover:bg-mist hover:text-ink",
          )}
        >
          <SETTINGS_ITEM.icon className="h-4.5 w-4.5" />
          {SETTINGS_ITEM.label}
        </Link>
        <Link
          href="/"
          className="flex items-center justify-between rounded-md border border-line px-3 py-2.5 text-sm text-ink-soft transition-colors hover:border-ink hover:text-ink"
        >
          View store
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
        <button
          onClick={logout}
          className="w-full rounded-md px-3 py-2 text-left text-sm text-stone transition-colors hover:text-accent"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}

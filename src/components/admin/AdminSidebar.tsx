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
  ReturnIcon,
  StarIcon,
  GridIcon,
} from "@/components/ui/Icons";

const NAV = [
  { label: "Dashboard", href: "/admin", icon: GridIcon },
  { label: "Products", href: "/admin/products", icon: BagIcon },
  { label: "Orders", href: "/admin/orders", icon: TruckIcon },
  { label: "Returns", href: "/admin/returns", icon: ReturnIcon },
  { label: "Offers", href: "/admin/offers", icon: StarIcon },
  { label: "Customers", href: "/admin/customers", icon: UserIcon },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

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
          // "/admin" must match exactly, else it'd highlight for every sub-route.
          const active =
            item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
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
          );
        })}
      </nav>

      <div className="m-3 space-y-2">
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

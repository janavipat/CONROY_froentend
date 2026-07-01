"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/utils/cn";
import { clearAdminKey } from "@/lib/admin-auth";
import { BagIcon, ArrowRightIcon, TruckIcon, UserIcon } from "@/components/ui/Icons";

const NAV = [
  { label: "Products", href: "/admin/products", icon: BagIcon },
  { label: "Orders", href: "/admin/orders", icon: TruckIcon },
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

      <nav className="flex-1 px-3 py-4">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                active ? "bg-ink text-white" : "text-ink-soft hover:bg-mist hover:text-ink",
              )}
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
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

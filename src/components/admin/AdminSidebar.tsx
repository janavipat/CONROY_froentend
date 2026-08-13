"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/utils/cn";
import { clearAdminKey } from "@/lib/admin-auth";
import {
  BagIcon,
  ArrowRightIcon,
  BoxIcon,
  TruckIcon,
  UserIcon,
  GridIcon,
  ChartIcon,
  LayersIcon,
  MegaphoneIcon,
  TagIcon,
  ReceiptIcon,
  ReturnIcon,
  CogIcon,
  HeadsetIcon,
  ChatIcon,
} from "@/components/ui/Icons";

interface NavItem {
  label: string;
  href: string;
  icon: typeof GridIcon;
  /** Exact match only — "/admin" would otherwise light up on every sub-route. */
  exact?: boolean;
}
interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * Grouped by what an operator is trying to do, rather than one flat list.
 *
 * Every entry points at a route that exists. The brief also asked for a
 * Content group (Homepage, Shop The Look, Banners) and split Analytics pages —
 * there are no admin routes behind those yet, and linking to them would put
 * 404s in the primary navigation, so they are left out rather than stubbed.
 */
const GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: GridIcon, exact: true },
      { label: "Analytics", href: "/admin/analytics", icon: ChartIcon },
    ],
  },
  {
    label: "Store",
    items: [
      { label: "Orders", href: "/admin/orders", icon: TruckIcon },
      { label: "Returns", href: "/admin/returns", icon: ReturnIcon },
      { label: "Products", href: "/admin/products", icon: BagIcon },
      { label: "Collections", href: "/admin/collections", icon: LayersIcon },
      { label: "Inventory", href: "/admin/inventory", icon: BoxIcon },
      { label: "Customers", href: "/admin/customers", icon: UserIcon },
      { label: "Discounts", href: "/admin/offers", icon: TagIcon },
    ],
  },
  {
    label: "Engagement",
    items: [
      { label: "Messages", href: "/admin/contacts", icon: HeadsetIcon },
      { label: "Chat", href: "/admin/chat", icon: ChatIcon },
      { label: "Marketing", href: "/admin/marketing", icon: MegaphoneIcon },
    ],
  },
  {
    label: "Finance",
    items: [{ label: "Accounts", href: "/admin/accounts", icon: ReceiptIcon }],
  },
  {
    label: "System",
    items: [{ label: "Settings", href: "/admin/settings", icon: CogIcon }],
  },
];

/**
 * Spinner for the nav row you just clicked.
 *
 * useLinkStatus reads the enclosing Link's pending state, so this has to be a
 * child of the Link rather than something the sidebar tracks itself. It covers
 * the gap loading.tsx leaves: the route's fallback only appears once the
 * navigation is under way, whereas this responds to the click.
 */
function NavPending() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      aria-hidden
      className="ml-auto h-3 w-3 shrink-0 animate-spin rounded-full border border-white/30 border-t-white"
    />
  );
}

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  function logout() {
    clearAdminKey();
    onNavigate?.();
    router.replace("/admin/login");
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-[#111111] text-white">
      {/* Wordmark — the one place the brand serif belongs in here. */}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-white/10 px-5">
        <Link
          href="/admin"
          onClick={onNavigate}
          className="font-display text-[1.05rem] leading-none tracking-[0.22em] text-white"
        >
          CONROY
        </Link>
        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[0.5625rem] font-medium uppercase tracking-[0.12em] text-white/60">
          Admin
        </span>
      </div>

      {/* The nav scrolls when the viewport is short. Left unstyled the browser
          paints its default light track straight down the dark rail, which
          reads as a seam between the sidebar and the content. This makes it a
          thin translucent thumb on a transparent track — invisible at rest,
          legible while scrolling. */}
      <nav
        className={cn(
          "min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-3 py-4",
          "[scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.16)_transparent]",
          "[&::-webkit-scrollbar]:w-1.5",
          "[&::-webkit-scrollbar-track]:bg-transparent",
          "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/15",
          "hover:[&::-webkit-scrollbar-thumb]:bg-white/25",
        )}
      >
        {GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-1.5 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-white/35">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-lg py-2 pl-3 pr-2.5 text-[0.8125rem] transition-colors duration-150",
                      active
                        ? "bg-white/10 font-medium text-white"
                        : "text-white/60 hover:bg-white/[0.06] hover:text-white",
                    )}
                  >
                    {/* Small rail marks the active row without shouting. */}
                    <span
                      className={cn(
                        "absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r bg-white transition-opacity",
                        active ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                    <NavPending />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 space-y-1 border-t border-white/10 p-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center justify-between rounded-lg px-3 py-2 text-[0.8125rem] text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          View store
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </Link>
        <button
          onClick={logout}
          className="w-full rounded-lg px-3 py-2 text-left text-[0.8125rem] text-white/45 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          Log out
        </button>
      </div>
    </div>
  );
}

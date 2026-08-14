"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminGate } from "./AdminGate";
import { cn } from "@/utils/cn";
import { MenuIcon, CloseIcon, UserIcon, ChevronLeftIcon } from "@/components/ui/Icons";

/**
 * Where "back" goes: one level up the URL, not `router.back()`.
 *
 * History-based back is unpredictable here — arriving from the storefront, a
 * bookmark or a hard refresh sends the operator somewhere unrelated, or
 * nowhere. Walking the path is always the parent section: an order detail
 * returns to Orders, Orders returns to the Dashboard.
 */
function parentPath(pathname: string): string | null {
  if (pathname === "/admin" || pathname === "/admin/login") return null;
  const parts = pathname.split("/").filter(Boolean); // ["admin", …]
  const last = parts.pop();
  // An action segment sits under a record that has no page of its own —
  // /admin/products/[handle] only exists as /edit — so dropping just "edit"
  // would point the button at a 404. Drop the record id with it.
  if (last === "edit" && parts.length > 1) parts.pop();
  return `/${parts.join("/")}`;
}

/**
 * A path segment as it should read to a person.
 *
 * Segments arrive percent-encoded — a customer's phone number is routed as
 * `%2B910999812206`, which is what the crumb showed. decodeURIComponent throws
 * on a malformed escape, so a bad segment falls back to its raw form rather
 * than taking the whole shell down.
 */
function decodeSegment(part: string): string {
  try {
    return decodeURIComponent(part);
  } catch {
    return part;
  }
}

/** Route → breadcrumb trail. Falls back to the last path segment, title-cased. */
function breadcrumb(pathname: string): string[] {
  const parts = pathname.replace(/^\/admin\/?/, "").split("/").filter(Boolean).map(decodeSegment);
  if (!parts.length) return ["Dashboard"];
  return parts.map((p) =>
    p.length > 20 ? `#${p.slice(0, 8).toUpperCase()}` : p.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase()),
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Closing on navigation is handled by the sidebar's onNavigate, which every
  // link calls — doing it from an effect on `pathname` would set state during
  // render and cascade.
  //
  // The drawer is an overlay; the page beneath it must not scroll under it.
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  /**
   * Close the drawer when the window grows past `lg`.
   *
   * The drawer is a mobile affordance and its own `lg:hidden` hides it on a
   * wide screen — but `drawerOpen` stays true, so the body stays scroll-locked
   * and the drawer springs back the moment the window narrows again. Only the
   * listener flips it; there is no synchronous set here, because the trigger
   * that opens it is itself `lg:hidden` and cannot fire above the breakpoint.
   */
  useEffect(() => {
    if (!drawerOpen) return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setDrawerOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [drawerOpen]);

  if (pathname === "/admin/login") {
    return <div className="min-h-screen bg-[#F7F7F5]">{children}</div>;
  }

  const trail = breadcrumb(pathname);
  const back = parentPath(pathname);

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      {/* Desktop sidebar — fixed, so long tables scroll under it. */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[232px] lg:block">
        <AdminSidebar />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-[min(82vw,270px)] lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <AdminSidebar onNavigate={() => setDrawerOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-h-screen min-w-0 flex-col lg:pl-[232px]">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-[#E5E5E5] bg-white/95 px-4 backdrop-blur sm:px-6">
          <button
            onClick={() => setDrawerOpen(true)}
            className="-ml-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[#171717] transition-colors hover:bg-[#F5F5F4] lg:hidden"
            aria-label="Open menu"
          >
            <MenuIcon className="h-5 w-5" />
          </button>

          {/* Back — one level up. Absent on the dashboard, which has no parent. */}
          {back && (
            <Link
              href={back}
              aria-label="Back"
              title="Back"
              className="-ml-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[#525252] transition-colors hover:bg-[#F5F5F4] hover:text-[#171717]"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </Link>
          )}

          <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
            <ol className="flex items-center gap-1.5 text-[0.8125rem]">
              {trail.map((crumb, i) => (
                <li key={crumb + i} className="flex min-w-0 items-center gap-1.5">
                  {i > 0 && <span className="text-[#D4D4D4]">/</span>}
                  <span
                    className={cn(
                      "truncate",
                      i === trail.length - 1 ? "font-medium text-[#171717]" : "text-[#737373]",
                    )}
                  >
                    {crumb}
                  </span>
                </li>
              ))}
            </ol>
          </nav>

          <div className="flex shrink-0 items-center gap-1">
            {/* Store status — the site is public, so this reads "online". */}
            <span className="hidden items-center gap-1.5 rounded-full bg-[#16803C]/10 px-2.5 py-1 text-[0.6875rem] font-medium text-[#16803C] sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#16803C]" />
              Store online
            </span>

            <span className="ml-1 hidden h-6 w-px bg-[#E5E5E5] sm:block" />

            <div className="ml-1 flex items-center gap-2">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#171717] text-white">
                <UserIcon className="h-4 w-4" />
              </span>
              <span className="hidden text-[0.8125rem] font-medium text-[#171717] md:block">Admin</span>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6">
          <AdminGate>
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="min-w-0"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </AdminGate>
        </main>
      </div>

      {/* Closes the drawer from the keyboard without trapping focus elsewhere. */}
      {drawerOpen && (
        <button
          onClick={() => setDrawerOpen(false)}
          aria-label="Close menu"
          className="fixed right-4 top-3 z-[60] grid h-9 w-9 place-items-center rounded-lg bg-white text-[#171717] shadow lg:hidden"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

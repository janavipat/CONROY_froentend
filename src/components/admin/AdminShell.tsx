"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AdminSidebar } from "./AdminSidebar";
import { AdminGate } from "./AdminGate";

/** Admin chrome: the login page renders bare; everything else is gated + framed. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <div className="min-h-screen bg-mist">{children}</div>;
  }

  return (
    <div className="flex min-h-screen bg-mist">
      <AdminSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <div className="flex h-14 items-center justify-between border-b border-line bg-white px-4 md:hidden">
          <Link
            href="/admin"
            className="font-display text-base font-semibold tracking-[0.14em] text-ink"
          >
            CONROY Admin
          </Link>
          <Link href="/admin/products" className="text-sm text-ink-soft hover:text-ink">
            Products
          </Link>
        </div>

        <main className="flex-1 p-5 sm:p-8">
          <AdminGate>
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </AdminGate>
        </main>
      </div>
    </div>
  );
}

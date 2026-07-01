"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
          <AdminGate>{children}</AdminGate>
        </main>
      </div>
    </div>
  );
}

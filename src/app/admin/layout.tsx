import type { Metadata } from "next";
import Link from "next/link";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-mist">
      <AdminSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <div className="flex h-14 items-center justify-between border-b border-line bg-white px-4 md:hidden">
          <Link href="/admin" className="font-display text-base font-semibold tracking-[0.14em] text-ink">
            CONROY Admin
          </Link>
          <Link href="/admin/products" className="text-sm text-ink-soft hover:text-ink">
            Products
          </Link>
        </div>

        <main className="flex-1 p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}

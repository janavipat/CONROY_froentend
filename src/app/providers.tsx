"use client";

import { CartProvider } from "@/lib/cart-context";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider } from "@/lib/auth/auth-context";
import { WishlistProvider } from "@/lib/wishlist-context";

/** Client-side providers mounted once at the root. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            {children}
            <CartDrawer />
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

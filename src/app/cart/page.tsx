"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency } from "@/utils/format";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import {
  BagIcon,
  MinusIcon,
  PlusIcon,
  TruckIcon,
  ShieldIcon,
  ReturnIcon,
} from "@/components/ui/Icons";

export default function CartPage() {
  const { items, subtotal, removeItem, updateQuantity, count, clear } = useCart();
  const { toast } = useToast();

  function handleRemove(handle: string, size: string, title: string) {
    removeItem(handle, size);
    toast(`${title} removed from cart`, "info");
  }

  function handleClear() {
    clear();
    toast("Cart cleared", "info");
  }

  if (items.length === 0) {
    return (
      <Container className="flex min-h-[60vh] flex-col items-center justify-center gap-5 py-20 text-center">
        <span className="grid h-20 w-20 place-items-center rounded-full bg-mist">
          <BagIcon className="h-9 w-9 text-stone" />
        </span>
        <h1 className="font-display text-4xl text-ink">Your cart is empty</h1>
        <p className="text-ink-soft">Discover denim made to last.</p>
        <Button href="/collections/all">Shop the collection</Button>
      </Container>
    );
  }

  return (
    <Container className="py-12 lg:py-16">
      <h1 className="font-display text-4xl text-ink sm:text-5xl">Your Cart</h1>
      <p className="mt-2 text-sm text-stone">
        {count} {count === 1 ? "item" : "items"}
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        {/* Items */}
        <div>
          <ul className="space-y-4">
            {items.map((item) => (
              <li
                key={`${item.productHandle}-${item.size}`}
                className="flex gap-5 rounded-media border border-line bg-white p-4 shadow-sm"
              >
                <Link
                  href={`/products/${item.productHandle}`}
                  className="relative h-32 w-24 shrink-0 overflow-hidden rounded-md bg-mist"
                >
                  <Image src={item.image} alt={item.title} fill sizes="96px" className="object-cover" />
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex justify-between gap-3">
                    <div>
                      <Link
                        href={`/products/${item.productHandle}`}
                        className="font-display text-lg text-ink hover:text-stone"
                      >
                        {item.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-stone">
                        {item.fit} · Size {item.size}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-ink">
                      {formatCurrency(item.price * item.quantity, item.currency)}
                    </span>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <div className="flex items-center rounded-full border border-line">
                      <button
                        onClick={() => updateQuantity(item.productHandle, item.size, item.quantity - 1)}
                        className="grid h-9 w-9 place-items-center rounded-l-full text-ink transition-colors hover:bg-mist"
                        aria-label="Decrease quantity"
                      >
                        <MinusIcon className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center text-sm tabular-nums">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productHandle, item.size, item.quantity + 1)}
                        className="grid h-9 w-9 place-items-center rounded-r-full text-ink transition-colors hover:bg-mist"
                        aria-label="Increase quantity"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemove(item.productHandle, item.size, item.title)}
                      className="text-xs text-stone underline-offset-2 hover:text-accent hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex justify-between">
            <Link href="/collections/all" className="text-sm text-ink-soft hover:text-ink">
              ← Continue shopping
            </Link>
            <button onClick={handleClear} className="text-sm text-stone hover:text-accent">
              Clear cart
            </button>
          </div>
        </div>

        {/* Summary */}
        <aside className="h-fit rounded-media border border-line bg-paper p-7 lg:sticky lg:top-28">
          <h2 className="font-display text-2xl text-ink">Order Summary</h2>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Subtotal</dt>
              <dd className="text-ink">{formatCurrency(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Shipping</dt>
              <dd className="text-ink">Free</dd>
            </div>
          </dl>
          <div className="mt-5 flex justify-between border-t border-line pt-5">
            <span className="font-display text-lg text-ink">Total</span>
            <span className="font-display text-lg text-ink">{formatCurrency(subtotal)}</span>
          </div>

          <Button href="/checkout/payment" size="lg" className="mt-6 w-full">
            Proceed to payment
          </Button>

          {/* Trust badges */}
          <ul className="mt-6 space-y-3 border-t border-line pt-6 text-xs text-ink-soft">
            <li className="flex items-center gap-3">
              <TruckIcon className="h-4 w-4 text-ink" /> Free shipping across India
            </li>
            <li className="flex items-center gap-3">
              <ReturnIcon className="h-4 w-4 text-ink" /> 7-day easy returns
            </li>
            <li className="flex items-center gap-3">
              <ShieldIcon className="h-4 w-4 text-ink" /> Secure, encrypted payment
            </li>
          </ul>
        </aside>
      </div>
    </Container>
  );
}

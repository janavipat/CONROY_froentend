"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatCurrency } from "@/utils/format";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { MinusIcon, PlusIcon, BagIcon } from "@/components/ui/Icons";

export function CartDrawer() {
  const { items, isOpen, closeCart, subtotal, removeItem, updateQuantity, count } = useCart();

  return (
    <Modal open={isOpen} onClose={closeCart} position="right" label="Shopping cart" className="flex h-full w-[92vw] max-w-md flex-col">
      <div className="border-b border-line px-6 py-5">
        <h2 className="font-display text-xl text-ink">
          Your Cart {count > 0 && <span className="text-stone">({count})</span>}
        </h2>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <BagIcon className="h-10 w-10 text-stone" />
          <p className="text-ink-soft">Your cart is currently empty.</p>
          <Button href="/collections/all" onClick={closeCart} variant="outline">
            Shop the collection
          </Button>
        </div>
      ) : (
        <>
          <ul className="flex-1 divide-y divide-line overflow-y-auto px-6">
            {items.map((item) => (
              <li key={`${item.productHandle}-${item.size}`} className="flex gap-4 py-5">
                <Link
                  href={`/products/${item.productHandle}`}
                  onClick={closeCart}
                  className="relative h-24 w-20 shrink-0 overflow-hidden bg-cream"
                >
                  <Image src={item.image} alt={item.title} fill sizes="80px" className="object-cover" />
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex justify-between gap-2">
                    <span className="font-display text-base text-ink">{item.title}</span>
                    <button
                      onClick={() => removeItem(item.productHandle, item.size)}
                      className="text-xs text-stone underline-offset-2 hover:text-ink hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                  <span className="text-xs text-stone">
                    {item.fit} · Size {item.size}
                  </span>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="flex items-center border border-line">
                      <button
                        onClick={() => updateQuantity(item.productHandle, item.size, item.quantity - 1)}
                        className="grid h-8 w-8 place-items-center hover:bg-ink/5"
                        aria-label="Decrease quantity"
                      >
                        <MinusIcon className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productHandle, item.size, item.quantity + 1)}
                        className="grid h-8 w-8 place-items-center hover:bg-ink/5"
                        aria-label="Increase quantity"
                      >
                        <PlusIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="text-sm text-ink">
                      {formatCurrency(item.price * item.quantity, item.currency)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="border-t border-line px-6 py-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-soft">Subtotal</span>
              <span className="font-display text-lg text-ink">{formatCurrency(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-stone">Shipping and taxes calculated at checkout.</p>
            <div className="mt-4 flex flex-col gap-2">
              <Button href="/cart" onClick={closeCart}>
                View cart
              </Button>
              <Button href="/cart" onClick={closeCart} variant="outline">
                Checkout
              </Button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}

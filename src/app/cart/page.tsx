"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { useOfferQuote } from "@/hooks/useOfferQuote";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency } from "@/utils/format";
import { Container } from "@/components/ui/Container";
import { BackButton } from "@/components/ui/BackButton";
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

  // Priced by the server — see useOfferQuote. Until the first quote lands the
  // summary shows the undiscounted subtotal rather than a guess, so no figure
  // on screen is ever one the checkout won't honour.
  const { quote } = useOfferQuote(items);
  const discount = quote?.discount ?? 0;
  const total = quote?.total ?? subtotal;

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
      <Container className="py-10">
        <div className="flex">
          <BackButton fallbackHref="/collections/all" />
        </div>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-mist">
            <BagIcon className="h-9 w-9 text-stone" />
          </span>
          <h1 className="font-display text-4xl text-ink">Your cart is empty</h1>
          <p className="text-ink-soft">Discover denim made to last.</p>
          <Button href="/collections/all">Shop the collection</Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-section-sm">
      <div className="mb-6 flex">
        <BackButton fallbackHref="/collections/all" />
      </div>
      <h1 className="font-display text-4xl text-ink sm:text-5xl">Your Cart</h1>
      <p className="mt-2 text-sm text-stone">
        {count} {count === 1 ? "item" : "items"}
      </p>

      {/* [&>*]:min-w-0 — auto-sized grid tracks cannot go below their content's
          minimum, so a wide line item widened the page instead of wrapping. */}
      <div className="mt-10 grid gap-10 lg:grid-cols-[1.6fr_1fr] [&>*]:min-w-0">
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
        {/* A sticky box taller than the space below its top offset can never be
            scrolled to the end of — it stays pinned, so the overflow is not
            merely below the fold, it is unreachable. Capping the height to what
            is actually on screen and letting it scroll internally keeps the
            total and the pay button reachable on short windows. Taller windows
            never hit the cap, so the desktop appearance is unchanged. */}
        <aside className="h-fit rounded-media border border-line bg-paper p-7 lg:sticky lg:top-28 lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto">
          <h2 className="font-display text-2xl text-ink">Order Summary</h2>

          {/* The offer, in the house language: a hairline panel on the ink
              ground, no coupon chrome and no sale colour. Only shown once the
              server has priced the cart. */}
          {quote?.tier && (
            <div className="mt-5 border border-line bg-white px-4 py-3.5">
              <p className="eyebrow text-stone">Special offer</p>

              {/* The tier actually being applied — "Buy 1 → 30% off" at one
                  item, "Buy 2 → 50% off" from two. minUnits is the threshold
                  that earned it, so three items still reads "Buy 2". */}
              <p className="mt-1.5 font-display text-[1.0625rem] leading-none text-ink">
                Buy {quote.tier.minUnits} → {quote.tier.percent}% off
              </p>

              {quote.nextTier ? (
                <>
                  <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                    Add {quote.nextTier.unitsNeeded} more{" "}
                    {quote.nextTier.unitsNeeded === 1 ? "item" : "items"} to unlock{" "}
                    <span className="text-ink">{quote.nextTier.percent}% off</span>
                  </p>
                  {/* How far along they are, as a hairline rather than a
                      progress bar with a colour — the upsell without the
                      supermarket. */}
                  <div
                    aria-hidden
                    className="mt-2.5 h-px w-full bg-line"
                  >
                    <div
                      className="h-px bg-ink transition-[width] duration-500 ease-out"
                      style={{
                        width: `${Math.round(
                          (quote.tier.units /
                            (quote.tier.units + quote.nextTier.unitsNeeded)) *
                            100,
                        )}%`,
                      }}
                    />
                  </div>
                </>
              ) : (
                <p className="mt-2 text-xs leading-relaxed text-ink">
                  {quote.tier.percent}% off unlocked
                </p>
              )}
            </div>
          )}

          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Subtotal</dt>
              <dd className="text-ink">{formatCurrency(subtotal)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink-soft">
                  Offer discount
                  {quote?.tier && (
                    <span className="text-stone"> ({quote.tier.percent}%)</span>
                  )}
                </dt>
                <dd className="text-ink">−{formatCurrency(discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-ink-soft">Shipping</dt>
              <dd className="text-ink">Free</dd>
            </div>
          </dl>
          <div className="mt-5 flex justify-between border-t border-line pt-5">
            <span className="font-display text-lg text-ink">Total</span>
            <span className="font-display text-lg text-ink">{formatCurrency(total)}</span>
          </div>
          {discount > 0 && (
            <p className="mt-2 text-right text-xs text-stone">
              You save {formatCurrency(discount)}
            </p>
          )}

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

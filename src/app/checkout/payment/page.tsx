"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { createOrder, type PaymentMethod } from "@/services/orders";
import { processPayment } from "@/lib/payments";
import { formatCurrency } from "@/utils/format";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { CheckIcon, ShieldIcon, TruckIcon } from "@/components/ui/Icons";
import { cn } from "@/utils/cn";

const METHODS: { id: PaymentMethod; title: string; desc: string; icon: typeof ShieldIcon }[] = [
  {
    id: "online",
    title: "Pay online",
    desc: "UPI · Cards · Net Banking · Wallets",
    icon: ShieldIcon,
  },
  {
    id: "cod",
    title: "Cash on Delivery",
    desc: "Pay in cash when your order arrives",
    icon: TruckIcon,
  },
];

export default function PaymentPage() {
  const { items, subtotal, count, clear } = useCart();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("online");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ orderId?: string; method: PaymentMethod } | null>(null);

  async function handlePay() {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("Please enter a valid email for your order confirmation.");
      return;
    }
    setError("");
    setProcessing(true);

    const payment = await processPayment(method, subtotal);
    if (!payment.ok) {
      setProcessing(false);
      setError(payment.message ?? "Payment failed. Please try again.");
      return;
    }

    const order = await createOrder(email, items, method);
    setProcessing(false);
    if (order.ok) {
      setDone({ orderId: order.orderId, method });
      clear();
    } else {
      setError(order.message);
    }
  }

  /* ---- Success ---------------------------------------------------------- */
  if (done) {
    return (
      <Container className="flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-5 py-20 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-ink text-white">
          <CheckIcon className="h-7 w-7" />
        </span>
        <h1 className="font-display text-3xl text-ink sm:text-4xl">Order confirmed</h1>
        <p className="text-ink-soft">
          {done.method === "cod"
            ? "Your order is placed — pay in cash on delivery. A confirmation has been sent to your email."
            : "Payment received and your order is confirmed. A confirmation has been sent to your email."}
          {done.orderId && (
            <>
              {" "}
              Reference <span className="font-medium text-ink">{done.orderId.slice(0, 8)}</span>.
            </>
          )}
        </p>
        <Button href="/collections/all">Continue shopping</Button>
      </Container>
    );
  }

  /* ---- Empty cart guard ------------------------------------------------- */
  if (items.length === 0) {
    return (
      <Container className="flex min-h-[60vh] flex-col items-center justify-center gap-5 py-20 text-center">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">Your cart is empty</h1>
        <p className="text-ink-soft">Add something before heading to payment.</p>
        <Button href="/collections/all">Shop the collection</Button>
      </Container>
    );
  }

  /* ---- Payment ---------------------------------------------------------- */
  return (
    <Container className="py-12 lg:py-16">
      <nav className="mb-8 flex text-xs text-stone">
        <Link href="/cart" className="hover:text-ink">
          Cart
        </Link>
        <span className="mx-2" aria-hidden>
          /
        </span>
        <span className="text-ink">Payment</span>
      </nav>

      <h1 className="font-display text-3xl text-ink sm:text-4xl">Payment</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        {/* Left: contact + methods */}
        <div>
          <section>
            <h2 className="font-display text-xl text-ink">Contact</h2>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email for order confirmation"
              className="mt-3 h-12 w-full rounded-md border border-line bg-white px-3 text-[15px] text-ink placeholder:text-stone focus:border-ink focus:outline-none"
            />
          </section>

          <section className="mt-8">
            <h2 className="font-display text-xl text-ink">Payment method</h2>
            <div className="mt-3 space-y-3">
              {METHODS.map((m) => {
                const active = method === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={cn(
                      "flex w-full items-center gap-4 rounded-media border p-4 text-left transition-colors",
                      active ? "border-ink bg-paper" : "border-line hover:border-ink",
                    )}
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-mist text-ink">
                      <m.icon className="h-5 w-5" />
                    </span>
                    <span className="flex-1">
                      <span className="block text-[15px] font-medium text-ink">{m.title}</span>
                      <span className="block text-sm text-stone">{m.desc}</span>
                    </span>
                    <span
                      className={cn(
                        "grid h-5 w-5 shrink-0 place-items-center rounded-full border",
                        active ? "border-ink bg-ink text-white" : "border-line",
                      )}
                    >
                      {active && <CheckIcon className="h-3.5 w-3.5" />}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 flex items-center gap-2 text-xs text-stone">
              <ShieldIcon className="h-4 w-4" /> Payments are encrypted and secure.
            </p>
          </section>
        </div>

        {/* Right: order summary */}
        <aside className="h-fit rounded-media border border-line bg-paper p-6 lg:sticky lg:top-28">
          <h2 className="font-display text-xl text-ink">
            Order summary <span className="text-stone">({count})</span>
          </h2>
          <ul className="mt-4 space-y-4">
            {items.map((item) => (
              <li key={`${item.productHandle}-${item.size}`} className="flex gap-3">
                <span className="relative h-16 w-14 shrink-0 overflow-hidden rounded-md bg-mist">
                  <Image src={item.image} alt={item.title} fill sizes="56px" className="object-cover" />
                </span>
                <span className="flex-1 text-sm">
                  <span className="block text-ink">{item.title}</span>
                  <span className="block text-xs text-stone">
                    {item.fit} · Size {item.size} · Qty {item.quantity}
                  </span>
                </span>
                <span className="text-sm text-ink">
                  {formatCurrency(item.price * item.quantity, item.currency)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-2 border-t border-line pt-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Subtotal</dt>
              <dd className="text-ink">{formatCurrency(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Shipping</dt>
              <dd className="text-ink">Free</dd>
            </div>
          </dl>
          <div className="mt-4 flex justify-between border-t border-line pt-4">
            <span className="font-display text-lg text-ink">Total</span>
            <span className="font-display text-lg text-ink">{formatCurrency(subtotal)}</span>
          </div>

          {error && <p className="mt-4 text-xs text-accent">{error}</p>}

          <Button onClick={handlePay} size="lg" className="mt-5 w-full" disabled={processing}>
            {processing
              ? "Processing…"
              : method === "cod"
                ? "Place order"
                : `Pay ${formatCurrency(subtotal)}`}
          </Button>
          <button
            onClick={() => router.push("/cart")}
            className="mt-3 w-full text-center text-xs text-stone hover:text-ink"
          >
            ← Back to cart
          </button>
        </aside>
      </div>
    </Container>
  );
}

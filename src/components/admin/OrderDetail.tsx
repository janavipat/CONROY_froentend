"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  adminGetOrder,
  adminListProducts,
  type AdminOrder,
} from "@/services/admin";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/utils/cn";
import { ChevronLeftIcon, ReceiptIcon, ArrowRightIcon } from "@/components/ui/Icons";
import { Card, CardHeader, StatusBadge, BrandLoader } from "./ui";

function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function methodLabel(m: string): string {
  const k = (m || "").toLowerCase();
  if (k.includes("cod") || k.includes("cash")) return "Cash on Delivery";
  if (k.includes("razor")) return "Razorpay";
  if (!m) return "—";
  return m.charAt(0).toUpperCase() + m.slice(1);
}

/**
 * Splits a stored address into display lines.
 *
 * Addresses arrive as one string — sometimes newline-separated, sometimes
 * comma-separated — so this normalises both rather than printing a paragraph.
 * Purely presentational: nothing is reordered or dropped.
 */
function addressLines(raw: string, phone?: string | null): string[] {
  const lines = raw
    .split(/\r?\n|,/)
    .map((l) => l.trim())
    .filter(Boolean);

  // The stored string often ends with "Ph: 79901…", and the phone is already
  // shown on its own line beneath. Drop the repeat rather than print it twice;
  // if a line carries an address fragment as well, only the phone part goes.
  const digits = (phone ?? "").replace(/\D/g, "");
  if (!digits) return lines;
  return lines
    .map((l) => l.replace(/\s*(ph|phone|mob|mobile)[:.]?\s*\+?[\d\s-]{6,}\.?$/i, "").trim())
    .filter((l) => l && l.replace(/\D/g, "") !== digits);
}

function Row({
  label,
  value,
  tone,
  strong,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  tone?: string;
  strong?: boolean;
}) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4 py-2.5", strong && "py-3")}>
      <dt className={cn("min-w-0 text-[0.8125rem]", strong ? "font-semibold text-[#171717]" : "text-[#737373]")}>
        {label}
      </dt>
      <dd
        className={cn(
          "shrink-0 whitespace-nowrap tabular-nums",
          strong ? "text-[1.0625rem] font-semibold text-[#171717]" : "text-[0.8125rem] text-[#171717]",
          tone,
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export function OrderDetail({ id }: { id: string }) {
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  // Handles whose image failed to load — fall back to the initial rather than
  // letting the browser paint a broken-image icon in the frame.
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    adminGetOrder(id)
      .then((o) => {
        if (!active) return;
        setOrder(o);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setError("Could not load this order.");
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  // Thumbnails live on the catalogue, not the order line, so they're joined by
  // handle. Presentation only — a failure just leaves the initial fallback.
  useEffect(() => {
    let active = true;
    adminListProducts()
      .then((ps) => {
        if (!active) return;
        setThumbs(
          Object.fromEntries(
            ps.filter((p) => p.images[0]?.src).map((p) => [p.handle, p.images[0].src]),
          ),
        );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <BrandLoader label="Loading order" />;

  if (error || !order) {
    return (
      <div className="min-w-0">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1 text-[0.8125rem] text-[#737373] transition-colors hover:text-[#171717]"
        >
          <ChevronLeftIcon className="h-4 w-4" /> Orders
        </Link>
        <p className="mt-5 rounded-xl border border-[#DC2626]/25 bg-[#DC2626]/5 px-4 py-3 text-[0.8125rem] text-[#DC2626]">
          {error || "Order not found."}
        </p>
      </div>
    );
  }

  const cancelled = order.status === "cancelled";
  const paid = order.status === "paid";
  const itemCount = order.items.reduce((s, it) => s + it.quantity, 0);
  const paidAmount = paid ? order.total : 0;
  const balance = order.total - paidAmount;
  const short = `#${order.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="min-w-0 space-y-4">
      {/* Header */}
      <div className="min-w-0">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1 text-[0.8125rem] text-[#737373] transition-colors hover:text-[#171717]"
        >
          <ChevronLeftIcon className="h-4 w-4" /> Orders
        </Link>

        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1
                className={cn(
                  "text-[1.5rem] font-semibold tracking-[-0.02em] text-[#171717] sm:text-[1.75rem]",
                  cancelled && "text-[#737373] line-through",
                )}
              >
                {short}
              </h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="mt-1 text-[0.8125rem] text-[#737373]">
              {formatDateTime(order.createdAt)} · Online Store
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E5E5] bg-white px-3 py-2 text-[0.8125rem] font-medium text-[#171717] transition-colors hover:bg-[#F5F5F4]"
            >
              <ReceiptIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Print order</span>
            </button>
            <Link
              href="/admin/orders"
              className="hidden items-center gap-1.5 rounded-lg border border-[#E5E5E5] bg-white px-3 py-2 text-[0.8125rem] font-medium text-[#171717] transition-colors hover:bg-[#F5F5F4] sm:inline-flex"
            >
              Back to orders
            </Link>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[1.9fr_1fr]">
        {/* ── Left ───────────────────────────────────────────────────────── */}
        <div className="min-w-0 space-y-4">
          <Card padded={false} className="min-w-0 overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-[#E5E5E5] px-4 py-3.5 sm:px-5">
              <h2 className="text-[0.9375rem] font-semibold tracking-[-0.01em] text-[#171717]">
                Items{" "}
                <span className="font-normal text-[#737373]">
                  ({itemCount} {itemCount === 1 ? "item" : "items"})
                </span>
              </h2>
            </div>

            <ul className="divide-y divide-[#F0F0EE]">
              {order.items.map((it, i) => {
                const src = failed[it.product_handle] ? undefined : thumbs[it.product_handle];
                return (
                  <li key={`${it.product_handle}-${i}`} className="flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5">
                    <span className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-[#E5E5E5] bg-[#FAFAF9] text-[0.75rem] font-medium text-[#A3A3A3]">
                      {src ? (
                        <Image
                          src={src}
                          alt=""
                          fill
                          sizes="48px"
                          onError={() => setFailed((f) => ({ ...f, [it.product_handle]: true }))}
                          className="object-cover"
                        />
                      ) : (
                        it.title.charAt(0).toUpperCase()
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <Link
                        href={`/products/${it.product_handle}`}
                        className="block truncate text-[0.8125rem] font-medium text-[#171717] hover:text-[#2563EB]"
                        title={it.title}
                      >
                        {it.title}
                      </Link>
                      <span className="mt-0.5 block truncate text-[0.75rem] text-[#737373]">
                        {[it.size && `Size ${it.size}`, it.fit].filter(Boolean).join(" · ") || "—"}
                      </span>
                      {/* Unit price rides under the name on phones, where a
                          separate column would squeeze the line total out. */}
                      <span className="mt-0.5 block text-[0.75rem] tabular-nums text-[#737373] sm:hidden">
                        {formatCurrency(it.price, order.currency)} × {it.quantity}
                      </span>
                    </span>

                    <span className="hidden shrink-0 whitespace-nowrap text-right text-[0.8125rem] tabular-nums text-[#737373] sm:block">
                      {formatCurrency(it.price, order.currency)} × {it.quantity}
                    </span>
                    <span className="w-20 shrink-0 whitespace-nowrap text-right text-[0.8125rem] font-medium tabular-nums text-[#171717] sm:w-24">
                      {formatCurrency(it.price * it.quantity, order.currency)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>

          {/* Payment summary */}
          <Card className="min-w-0">
            <CardHeader
              title="Payment"
              action={
                <span
                  className={cn(
                    "text-[0.75rem] font-medium",
                    paid ? "text-[#16803C]" : cancelled ? "text-[#DC2626]" : "text-[#B45309]",
                  )}
                >
                  {paid ? "Paid in full" : cancelled ? "Cancelled" : "Payment pending"}
                </span>
              }
            />
            <dl className="mt-2 divide-y divide-[#F0F0EE]">
              <Row
                label={
                  <>
                    Subtotal <span className="text-[#A3A3A3]">· {itemCount} item{itemCount === 1 ? "" : "s"}</span>
                  </>
                }
                value={formatCurrency(order.subtotal, order.currency)}
              />
              {order.discount > 0 && (
                <Row
                  label={
                    <>
                      Discount{order.offerCode && <span className="text-[#A3A3A3]"> · {order.offerCode}</span>}
                    </>
                  }
                  value={`− ${formatCurrency(order.discount, order.currency)}`}
                  tone="text-[#16803C]"
                />
              )}
              <Row label="Payment method" value={methodLabel(order.paymentMethod)} />
              <Row label="Total" value={formatCurrency(order.total, order.currency)} strong />
              <Row
                label="Paid"
                value={formatCurrency(paidAmount, order.currency)}
                tone={paid ? "text-[#16803C]" : undefined}
              />
              {balance > 0 && !cancelled && (
                <Row
                  label="Balance due"
                  value={formatCurrency(balance, order.currency)}
                  tone="text-[#B45309]"
                />
              )}
            </dl>
          </Card>

          {/* Timeline — derived strictly from fields the order actually has. */}
          <Card className="min-w-0">
            <CardHeader title="Timeline" />
            <ol className="mt-3 space-y-0">
              {[
                { label: "Order placed", meta: formatDateTime(order.createdAt), tone: "bg-[#171717]" },
                {
                  label: `Payment · ${methodLabel(order.paymentMethod)}`,
                  meta: paid ? "Paid in full" : cancelled ? "Not collected" : "Awaiting payment",
                  tone: paid ? "bg-[#16803C]" : cancelled ? "bg-[#DC2626]" : "bg-[#D97706]",
                },
                ...(cancelled
                  ? [{ label: "Order cancelled", meta: "No further action", tone: "bg-[#DC2626]" }]
                  : []),
              ].map((e, i, arr) => (
                <li key={e.label} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", e.tone)} />
                    {i < arr.length - 1 && <span className="w-px flex-1 bg-[#E5E5E5]" />}
                  </div>
                  <div className={cn("min-w-0", i < arr.length - 1 && "pb-4")}>
                    <p className="text-[0.8125rem] font-medium text-[#171717]">{e.label}</p>
                    <p className="mt-0.5 text-[0.75rem] text-[#737373]">{e.meta}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-3 border-t border-[#F0F0EE] pt-3 text-[0.6875rem] text-[#A3A3A3]">
              Built from this order&apos;s own fields — no separate event log is recorded yet.
            </p>
          </Card>
        </div>

        {/* ── Right ──────────────────────────────────────────────────────── */}
        <div className="min-w-0 space-y-4">
          <Card className="min-w-0">
            <CardHeader title="Customer" />
            <div className="mt-3 flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#171717] text-[0.75rem] font-semibold text-white">
                {(order.customerName || "Guest").charAt(0).toUpperCase()}
              </span>
              <p className="min-w-0 flex-1 break-words text-[0.8125rem] font-medium text-[#171717]">
                {order.customerName || "Guest"}
              </p>
            </div>
            {order.phone && (
              <Link
                href={`/admin/customers/${encodeURIComponent(order.phone)}`}
                className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-[#E5E5E5] py-2 text-[0.8125rem] font-medium text-[#171717] transition-colors hover:bg-[#F5F5F4]"
              >
                View customer <ArrowRightIcon className="h-3.5 w-3.5" />
              </Link>
            )}
          </Card>

          <Card className="min-w-0">
            <CardHeader title="Contact information" />
            <div className="mt-3 space-y-1.5">
              <a
                href={`mailto:${order.email}`}
                className="block break-all text-[0.8125rem] text-[#171717] hover:text-[#2563EB] hover:underline"
              >
                {order.email}
              </a>
              {order.phone ? (
                <a
                  href={`tel:${order.phone}`}
                  className="block text-[0.8125rem] text-[#171717] hover:text-[#2563EB] hover:underline"
                >
                  {order.phone}
                </a>
              ) : (
                <p className="text-[0.8125rem] text-[#A3A3A3]">No phone number</p>
              )}
            </div>
          </Card>

          <Card className="min-w-0">
            <CardHeader title="Shipping address" />
            {order.shippingAddress ? (
              <address className="mt-3 space-y-0.5 not-italic">
                {order.customerName && (
                  <p className="break-words text-[0.8125rem] font-medium text-[#171717]">{order.customerName}</p>
                )}
                {addressLines(order.shippingAddress, order.phone).map((line, i) => (
                  <p key={i} className="break-words text-[0.8125rem] text-[#525252]">
                    {line}
                  </p>
                ))}
                {order.phone && <p className="pt-1 text-[0.8125rem] text-[#737373]">{order.phone}</p>}
              </address>
            ) : (
              <p className="mt-3 text-[0.8125rem] text-[#A3A3A3]">No shipping address on file</p>
            )}
          </Card>

          <Card className="min-w-0">
            <CardHeader title="Notes" />
            <p className="mt-3 text-[0.8125rem] text-[#A3A3A3]">No notes from customer</p>
          </Card>

          <Card className="min-w-0">
            <CardHeader title="Order details" />
            <dl className="mt-2 divide-y divide-[#F0F0EE]">
              <Row label="Order ID" value={<span className="font-mono text-[0.75rem]">{short}</span>} />
              <Row label="Channel" value="Online Store" />
              <Row label="Payment method" value={methodLabel(order.paymentMethod)} />
              {order.offerCode && <Row label="Offer code" value={order.offerCode} />}
              <Row label="Currency" value={order.currency} />
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";

/**
 * Analytics charts.
 *
 * These measure their container and draw at real pixel sizes rather than
 * stretching a fixed viewBox. Stretching is what made the old charts look
 * wrong: `preserveAspectRatio="none"` squashes the type and the stroke along
 * with the plot, so labels distorted and the line thinned out on wide screens.
 * Measuring costs one ResizeObserver and keeps text crisp at any width.
 */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  return { ref, width };
}

/** Rounded "nice" ceiling so the axis reads 0 / 5k / 10k rather than 0 / 4,317. */
function niceMax(value: number): number {
  if (value <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(value));
  const n = value / mag;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * mag;
}

function Tooltip({
  x,
  y,
  title,
  value,
  width,
}: {
  x: number;
  y: number;
  title: string;
  value: string;
  width: number;
}) {
  // Keep the card inside the plot, whichever end of the series is hovered.
  const w = 132;
  const left = Math.min(Math.max(x - w / 2, 4), Math.max(4, width - w - 4));
  return (
    <div
      className="pointer-events-none absolute z-10 rounded-lg border border-[#E5E5E5] bg-white px-2.5 py-1.5 shadow-md"
      style={{ left, top: Math.max(4, y - 54), width: w }}
    >
      <p className="text-[0.6875rem] text-[#737373]">{title}</p>
      <p className="text-[0.8125rem] font-semibold tabular-nums text-[#171717]">{value}</p>
    </div>
  );
}

/* ─────────────────────────── Revenue (area) ─────────────────────────────── */

export function RevenueChart({
  points,
  labels,
  format,
  height = 320,
}: {
  points: number[];
  labels: string[];
  format: (n: number) => string;
  height?: number;
}) {
  const { ref, width } = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const padL = 52;
  const padR = 12;
  const padT = 14;
  const padB = 28;
  const n = points.length;
  const max = niceMax(Math.max(...points, 0));
  const plotW = Math.max(0, width - padL - padR);
  const plotH = height - padT - padB;

  const x = useCallback(
    (i: number) => (n <= 1 ? padL + plotW / 2 : padL + (i * plotW) / (n - 1)),
    [n, plotW],
  );
  const y = useCallback((v: number) => padT + (1 - v / max) * plotH, [max, plotH]);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!n || plotW <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = e.clientX - rect.left - padL;
    const i = n <= 1 ? 0 : Math.round((rel / plotW) * (n - 1));
    setHover(Math.min(n - 1, Math.max(0, i)));
  };

  const line = points.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`).join(" ");
  const area = n ? `${line} L ${x(n - 1)} ${padT + plotH} L ${x(0)} ${padT + plotH} Z` : "";
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  // Thin the date labels so they never collide on a narrow column.
  const step = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(plotW / 74))));

  return (
    <div
      ref={ref}
      className="relative w-full"
      style={{ height }}
      onMouseMove={onMove}
      onMouseLeave={() => setHover(null)}
    >
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label="Revenue per day">
          <defs>
            <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#171717" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#171717" stopOpacity="0" />
            </linearGradient>
          </defs>

          {ticks.map((t) => {
            const gy = padT + t * plotH;
            return (
              <g key={t}>
                <line x1={padL} x2={width - padR} y1={gy} y2={gy} stroke="#EFEFED" />
                <text x={padL - 8} y={gy + 3.5} textAnchor="end" fill="#A3A3A3" style={{ fontSize: 10 }}>
                  {format(Math.round(max * (1 - t)))}
                </text>
              </g>
            );
          })}

          {n > 0 && (
            <>
              <path d={area} fill="url(#revFill)" />
              <path d={line} fill="none" stroke="#171717" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            </>
          )}

          {labels.map((l, i) =>
            i % step === 0 || i === n - 1 ? (
              <text key={i} x={x(i)} y={height - 8} textAnchor="middle" fill="#A3A3A3" style={{ fontSize: 10 }}>
                {l}
              </text>
            ) : null,
          )}

          {hover !== null && n > 0 && (
            <>
              <line x1={x(hover)} x2={x(hover)} y1={padT} y2={padT + plotH} stroke="#D4D4D4" strokeDasharray="3 3" />
              <circle cx={x(hover)} cy={y(points[hover])} r={4} fill="#171717" />
            </>
          )}
        </svg>
      )}

      {hover !== null && n > 0 && (
        <Tooltip x={x(hover)} y={y(points[hover])} title={labels[hover]} value={format(points[hover])} width={width} />
      )}
    </div>
  );
}

/* ─────────────────────────── Orders (bars) ──────────────────────────────── */

export function OrdersChart({
  points,
  labels,
  height = 260,
}: {
  points: number[];
  labels: string[];
  height?: number;
}) {
  const { ref, width } = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const padL = 34;
  const padR = 12;
  const padT = 14;
  const padB = 28;
  const n = points.length;
  const max = niceMax(Math.max(...points, 0));
  const plotW = Math.max(0, width - padL - padR);
  const plotH = height - padT - padB;
  const slot = n ? plotW / n : 0;
  // Capped so a sparse series shows honest bars instead of a few fat slabs.
  const barW = Math.max(3, Math.min(28, slot * 0.55));
  const ticks = [0, 0.5, 1];
  const step = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(plotW / 74))));

  return (
    <div ref={ref} className="relative w-full" style={{ height }} onMouseLeave={() => setHover(null)}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label="Orders per day">
          {ticks.map((t) => {
            const gy = padT + t * plotH;
            return (
              <g key={t}>
                <line x1={padL} x2={width - padR} y1={gy} y2={gy} stroke="#EFEFED" />
                <text x={padL - 8} y={gy + 3.5} textAnchor="end" fill="#A3A3A3" style={{ fontSize: 10 }}>
                  {Math.round(max * (1 - t))}
                </text>
              </g>
            );
          })}

          {points.map((v, i) => {
            const cx = padL + slot * i + slot / 2;
            const h = max ? (v / max) * plotH : 0;
            return (
              <g key={i} onMouseEnter={() => setHover(i)}>
                {/* Full-height hit area so thin bars are still easy to hover. */}
                <rect x={cx - slot / 2} y={padT} width={slot} height={plotH} fill="transparent" />
                <rect
                  x={cx - barW / 2}
                  y={padT + plotH - h}
                  width={barW}
                  height={Math.max(v > 0 ? 2 : 0, h)}
                  rx={2}
                  fill={hover === i ? "#171717" : "#C7C7C4"}
                  className="transition-[fill] duration-150"
                />
              </g>
            );
          })}

          {labels.map((l, i) =>
            i % step === 0 || i === n - 1 ? (
              <text
                key={i}
                x={padL + slot * i + slot / 2}
                y={height - 8}
                textAnchor="middle"
                fill="#A3A3A3"
                style={{ fontSize: 10 }}
              >
                {l}
              </text>
            ) : null,
          )}
        </svg>
      )}

      {hover !== null && n > 0 && (
        <Tooltip
          x={padL + slot * hover + slot / 2}
          y={padT + plotH - (max ? (points[hover] / max) * plotH : 0)}
          title={labels[hover]}
          value={`${points[hover]} order${points[hover] === 1 ? "" : "s"}`}
          width={width}
        />
      )}
    </div>
  );
}

/* ─────────────────────────── Status (donut) ─────────────────────────────── */

/**
 * Order state → colour, matching the badges used across the admin: settled is
 * green, awaiting is amber, failed is red, anything else neutral. The brief
 * proposed a different mapping (paid amber, cancelled green); that would read
 * as a warning on a successful order and a success on a failed one, and would
 * contradict the badges on every other admin screen.
 */
const SLICE_COLOURS: Record<string, string> = {
  paid: "#16803C",
  delivered: "#16803C",
  cod_pending: "#D97706",
  pending: "#D97706",
  processing: "#2563EB",
  cancelled: "#DC2626",
  failed: "#DC2626",
  refunded: "#7C3AED",
};
const FALLBACK = "#A3A3A3";

function sliceLabel(status: string): string {
  if (status === "cod_pending") return "Cash on delivery";
  return status.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export function StatusDonut({
  slices,
  size = 200,
}: {
  slices: { label: string; value: number }[];
  size?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const total = slices.reduce((a, s) => a + s.value, 0);
  const r = size / 2 - 10;
  const stroke = 22; // A wider ring leaves a larger centre for the total.
  const c = 2 * Math.PI * r;

  // Cumulative offsets computed without mutating anything during render.
  const fracs = slices.map((s) => (total ? s.value / total : 0));
  const arcs = slices.map((s, i) => ({
    ...s,
    i,
    frac: fracs[i],
    dash: fracs[i] * c,
    offset: fracs.slice(0, i).reduce((a, b) => a + b, 0) * c,
  }));

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} role="img" aria-label="Orders by status">
          <g transform={`translate(${size / 2} ${size / 2}) rotate(-90)`}>
            <circle r={r} fill="none" stroke="#F0F0EE" strokeWidth={stroke} />
            {arcs.map((a) => (
              <circle
                key={a.label}
                r={r}
                fill="none"
                stroke={SLICE_COLOURS[a.label] ?? FALLBACK}
                strokeWidth={hover === a.i ? stroke + 4 : stroke}
                strokeDasharray={`${a.dash} ${c - a.dash}`}
                strokeDashoffset={-a.offset}
                className="cursor-pointer transition-[stroke-width] duration-150"
                onMouseEnter={() => setHover(a.i)}
                onMouseLeave={() => setHover(null)}
              />
            ))}
          </g>
        </svg>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          {hover === null ? (
            <div>
              <p className="text-[1.375rem] font-semibold leading-none tabular-nums text-[#171717]">{total}</p>
              <p className="mt-1 text-[0.6875rem] text-[#737373]">orders</p>
            </div>
          ) : (
            <div className="px-6">
              <p className="text-[1.25rem] font-semibold leading-none tabular-nums text-[#171717]">
                {slices[hover].value}
              </p>
              <p className="mt-1 text-[0.6875rem] leading-tight text-[#737373]">{sliceLabel(slices[hover].label)}</p>
            </div>
          )}
        </div>
      </div>

      <ul className="w-full min-w-0 space-y-2">
        {arcs.map((a) => (
          <li
            key={a.label}
            onMouseEnter={() => setHover(a.i)}
            onMouseLeave={() => setHover(null)}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[0.8125rem] transition-colors",
              hover === a.i ? "bg-[#FAFAF9]" : "",
            )}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: SLICE_COLOURS[a.label] ?? FALLBACK }}
            />
            <span className="min-w-0 flex-1 truncate text-[#171717]">{sliceLabel(a.label)}</span>
            <span className="shrink-0 tabular-nums text-[#737373]">
              {a.value} · {total ? Math.round(a.frac * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

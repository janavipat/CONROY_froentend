-- ============================================================================
-- CONROY — offers / discounts
-- Run this in Supabase → SQL Editor after schema.sql. Safe to re-run.
--
-- An offer is a single discount rule. Four types:
--   all_products  — applies to the whole cart
--   product       — applies to one product's line items (product_handle)
--   order_above   — applies when subtotal >= min_order_amount
--   code          — applies only when the shopper enters `code` at checkout
--
-- Business rule: only ONE offer may be active at a time (enforced by the API,
-- which deactivates the others when you activate one).
-- ============================================================================

create extension if not exists "pgcrypto";

create table if not exists public.offers (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  type             text not null
                   check (type in ('all_products', 'product', 'order_above', 'code')),
  discount_type    text not null default 'percent'
                   check (discount_type in ('percent', 'flat')),
  discount_value   integer not null check (discount_value >= 0),
  product_handle   text,               -- for type 'product'
  min_order_amount integer,            -- for type 'order_above'
  code             text,               -- for type 'code'
  active           boolean not null default false,
  created_at       timestamptz not null default now()
);

create index if not exists offers_active_idx on public.offers(active);

alter table public.offers enable row level security;

-- Discount fields recorded on each order (best-effort; safe to re-run).
alter table public.orders
  add column if not exists discount   integer not null default 0,
  add column if not exists offer_code text;

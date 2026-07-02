-- ============================================================================
-- CONROY — order returns / replacements (child records under an order)
-- Run this in Supabase → SQL Editor after schema.sql. Safe to re-run.
--
-- A "return" is a customer request to return or replace some/all items of an
-- order. It snapshots the customer + returned line items, the reason, the
-- requested resolution (refund or replacement), and its processing status.
-- ============================================================================

create extension if not exists "pgcrypto";

create table if not exists public.returns (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  email       text not null,
  full_name   text,
  phone       text,
  reason      text not null,
  resolution  text not null default 'refund'
              check (resolution in ('refund', 'replacement')),
  status      text not null default 'requested'
              check (status in ('requested', 'approved', 'rejected', 'refunded', 'replaced', 'completed')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists returns_order_idx   on public.returns(order_id);
create index if not exists returns_phone_idx   on public.returns(phone);
create index if not exists returns_created_idx on public.returns(created_at desc);

create table if not exists public.return_items (
  id             uuid primary key default gen_random_uuid(),
  return_id      uuid not null references public.returns(id) on delete cascade,
  product_handle text not null,
  title          text not null,
  size           text not null,
  price          integer not null,
  quantity       integer not null check (quantity > 0)
);

create index if not exists return_items_return_idx on public.return_items(return_id);

-- RLS: like orders, returns are only touched by the API (service-role key).
alter table public.returns      enable row level security;
alter table public.return_items enable row level security;

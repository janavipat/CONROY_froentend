-- ============================================================================
-- CONROY — storefront analytics + wishlist
-- Run this in Supabase → SQL Editor after schema.sql. Safe to re-run.
--
--   page_views     — every page view with time-on-page (for "which page, how
--                    long, how many times")
--   cart_adds      — every add-to-cart (to find products added but not bought)
--   product_likes  — wishlist / likes (which products customers love)
-- ============================================================================

create extension if not exists "pgcrypto";

create table if not exists public.page_views (
  id          uuid primary key default gen_random_uuid(),
  session_id  text not null,
  path        text not null,
  duration_ms integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists page_views_path_idx    on public.page_views (path);
create index if not exists page_views_created_idx on public.page_views (created_at desc);

create table if not exists public.cart_adds (
  id             uuid primary key default gen_random_uuid(),
  session_id     text not null,
  product_handle text not null,
  created_at     timestamptz not null default now()
);
create index if not exists cart_adds_product_idx on public.cart_adds (product_handle);

create table if not exists public.product_likes (
  id             uuid primary key default gen_random_uuid(),
  product_handle text not null,
  user_key       text not null,          -- signed-in phone, or an anon browser id
  created_at     timestamptz not null default now(),
  unique (product_handle, user_key)
);
create index if not exists product_likes_product_idx on public.product_likes (product_handle);
create index if not exists product_likes_user_idx    on public.product_likes (user_key);

alter table public.page_views    enable row level security;
alter table public.cart_adds     enable row level security;
alter table public.product_likes enable row level security;

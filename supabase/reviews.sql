-- ============================================================================
-- CONROY — product reviews (ratings + feedback + photos)
-- Run this in Supabase → SQL Editor after schema.sql. Safe to re-run.
-- Photos are stored in Supabase Storage; only their URLs live here.
-- ============================================================================

create extension if not exists "pgcrypto";

create table if not exists public.reviews (
  id             uuid primary key default gen_random_uuid(),
  product_handle text not null references public.products(handle) on delete cascade,
  author         text not null,
  rating         integer not null check (rating between 1 and 5),
  title          text,
  body           text not null default '',
  images         text[] not null default '{}',
  created_at     timestamptz not null default now()
);

create index if not exists reviews_product_idx on public.reviews(product_handle);
create index if not exists reviews_created_idx on public.reviews(created_at desc);

alter table public.reviews enable row level security;

-- Public can read reviews; writes go through the API (service role).
drop policy if exists "reviews_public_read" on public.reviews;
create policy "reviews_public_read" on public.reviews for select using (true);

drop policy if exists "reviews_public_insert" on public.reviews;
create policy "reviews_public_insert" on public.reviews for insert with check (true);

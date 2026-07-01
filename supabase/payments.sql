-- ============================================================================
-- CONROY — Razorpay payment references on orders
-- Run this in the Supabase Dashboard → SQL Editor.
-- Safe to re-run: uses ADD COLUMN IF NOT EXISTS.
--
-- These columns are OPTIONAL — online checkout works without them (the payment
-- reference is simply not stored). Run this migration to record which Razorpay
-- order/payment settled each order.
-- ============================================================================

alter table public.orders
  add column if not exists payment_provider    text,
  add column if not exists razorpay_order_id   text,
  add column if not exists razorpay_payment_id text;

create index if not exists orders_razorpay_payment_id_idx
  on public.orders (razorpay_payment_id);

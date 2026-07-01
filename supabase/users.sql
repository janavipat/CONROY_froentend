-- ============================================================================
-- CONROY — customers (phone-OTP accounts). Run in Supabase → SQL Editor.
-- Used to detect first-time signups (to send the welcome email) and to store
-- the email a shopper provides at signup.
-- ============================================================================

create table if not exists public.users (
  phone       text primary key,
  email       text,
  created_at  timestamptz not null default now()
);

alter table public.users enable row level security;
-- Writes happen through the API (service role); no anon policies needed.

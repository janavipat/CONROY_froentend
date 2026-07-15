-- Chat widget — visitor messages from the storefront chat bubble.
-- Run this on an existing database (it is also included in all_migrations.sql).
--
-- Name/email are optional: the widget is open to anonymous visitors, so only
-- `message` is guaranteed. `status` tracks admin triage.

create table if not exists public.chat_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text,
  email      text,
  message    text not null,
  status     text not null default 'new',
  created_at timestamptz not null default now()
);

-- Newest-first listing in the admin inbox.
create index if not exists chat_messages_created_at_idx
  on public.chat_messages (created_at desc);

alter table public.chat_messages enable row level security;

-- Anonymous visitors may submit a message; reads/updates go through the API
-- with the service-role key (admin only).
drop policy if exists "anon_insert_chat_messages" on public.chat_messages;
create policy "anon_insert_chat_messages" on public.chat_messages for insert with check (true);

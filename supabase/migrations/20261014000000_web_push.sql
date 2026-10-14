-- Notifications on the web: each browser a person turns on gets a push subscription.
-- Belluh's VAPID key pair is made on first use and kept server-side (no client can read app_keys).

create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  endpoint    text not null unique check (char_length(endpoint) < 1000),  -- the server only ever calls real push services (webpush.ts)
  p256dh      text not null check (char_length(p256dh) between 80 and 100),
  auth        text not null check (char_length(auth) between 16 and 40),
  user_agent  text check (char_length(user_agent) < 300),
  created_at  timestamptz not null default now(),
  last_ok_at  timestamptz
);
create index if not exists push_subscriptions_user on public.push_subscriptions (user_id);
alter table public.push_subscriptions enable row level security;
drop policy if exists push_own_select on public.push_subscriptions;
drop policy if exists push_own_insert on public.push_subscriptions;
drop policy if exists push_own_delete on public.push_subscriptions;
create policy push_own_select on public.push_subscriptions for select to authenticated using (user_id = auth.uid());
create policy push_own_insert on public.push_subscriptions for insert to authenticated with check (user_id = auth.uid());
create policy push_own_delete on public.push_subscriptions for delete to authenticated using (user_id = auth.uid());
revoke all on public.push_subscriptions from anon;
revoke update on public.push_subscriptions from authenticated;

create table if not exists public.app_keys (
  name        text primary key,
  value       jsonb not null,
  created_at  timestamptz not null default now()
);
alter table public.app_keys enable row level security;   -- no policies: service role only
revoke all on public.app_keys from anon, authenticated;

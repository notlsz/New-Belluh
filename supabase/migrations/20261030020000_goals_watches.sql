-- Goals the two of them work toward together (a date night every week, saving for Kyoto, a gift budget), and things
-- Bella keeps watching for one of them (tickets going on sale, a price dropping). Both are read by the app and written
-- only by Belluh's backend, after it checks who is asking.

create table if not exists public.couple_goals (
  id          uuid primary key default gen_random_uuid(),
  created_by  uuid not null references auth.users(id) on delete cascade,
  partner_id  uuid references auth.users(id) on delete set null,
  -- save: money toward something; habit: a thing done every week or month; budget: a cap on what they spend
  kind        text not null check (kind in ('save', 'habit', 'budget')),
  title       text not null check (char_length(title) between 2 and 80),
  target      numeric not null check (target > 0 and target <= 10000000),
  progress    numeric not null default 0 check (progress >= 0 and progress <= 100000000),
  currency    text check (currency is null or currency ~ '^[A-Z]{3}$'),
  period      text check (period is null or period in ('week', 'month')),
  period_key  text,             -- the week or month progress counts toward, for habits and budgets ("2026-W44", "2026-10")
  due_on      date,
  status      text not null default 'active' check (status in ('active', 'done', 'stopped')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (partner_id is null or partner_id <> created_by)
);
create index if not exists couple_goals_people on public.couple_goals (created_by, partner_id, status);
alter table public.couple_goals enable row level security;
drop policy if exists couple_goals_pair_read on public.couple_goals;
create policy couple_goals_pair_read on public.couple_goals for select to authenticated using (auth.uid() in (created_by, partner_id));
revoke all on public.couple_goals from anon;
revoke insert, update, delete on public.couple_goals from authenticated;

create table if not exists public.watches (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  -- event: tickets for a show or game going on sale; price: something they want, at or under a price
  kind        text not null check (kind in ('event', 'price')),
  what        text not null check (char_length(what) between 2 and 120),
  place       text check (place is null or char_length(place) <= 80),
  max_cents   int check (max_cents is null or max_cents between 1 and 100000000),
  until_on    date not null,
  status      text not null default 'watching' check (status in ('watching', 'found', 'stopped', 'expired')),
  found       jsonb,            -- what Bella found: { title, url, price, on_sale }
  checked_at  timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists watches_open on public.watches (status, checked_at);
alter table public.watches enable row level security;
drop policy if exists watches_own on public.watches;
create policy watches_own on public.watches for select to authenticated using (user_id = auth.uid());
revoke all on public.watches from anon;
revoke insert, update, delete on public.watches from authenticated;

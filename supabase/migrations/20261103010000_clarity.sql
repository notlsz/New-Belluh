-- Clarity: a private page for one partner. Patterns from the person's own writing are computed on demand and never
-- stored; only these three things are kept, each readable and deletable by its owner alone (never the partner, never
-- shared). Turning Clarity off deletes all three (belluh-clarity "off"); deleting the account deletes them by cascade.

create table if not exists public.clarity_settings (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  turned_on_at  timestamptz not null default now()
);

-- The person's own answers to Clarity's questions
create table if not exists public.clarity_reflections (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  key         text not null check (key in ('want', 'unsaid', 'change', 'line')),
  text        text not null check (char_length(text) between 1 and 4000),
  created_at  timestamptz not null default now()
);
create index if not exists clarity_reflections_user on public.clarity_reflections (user_id, created_at);

-- The person's talk with Bella on the Clarity page, kept apart from their usual chat with her
create table if not exists public.clarity_talk (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null check (role in ('user', 'bella')),
  body        text not null check (char_length(body) between 1 and 8000),
  created_at  timestamptz not null default now()
);
create index if not exists clarity_talk_user on public.clarity_talk (user_id, created_at);

alter table public.clarity_settings enable row level security;
alter table public.clarity_reflections enable row level security;
alter table public.clarity_talk enable row level security;

-- Owner only, for every operation. No partner clause anywhere.
drop policy if exists cs_owner on public.clarity_settings;
drop policy if exists cr_owner on public.clarity_reflections;
drop policy if exists ct_owner on public.clarity_talk;
create policy cs_owner on public.clarity_settings for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy cr_owner on public.clarity_reflections for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy ct_owner on public.clarity_talk for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke all on public.clarity_settings, public.clarity_reflections, public.clarity_talk from anon;

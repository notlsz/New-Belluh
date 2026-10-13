-- Belluh's weekly loop: one thing to try together each week, a midweek check-in, and what happened.

-- Each person's time zone, so Sunday and Wednesday arrive at the right local time
create table if not exists public.agent_settings (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  timezone        text not null default 'America/New_York',
  weekly_enabled  boolean not null default true,
  updated_at      timestamptz not null default now()
);

-- One shared action per couple per week (user_a < user_b), or per person when no partner is connected
create table if not exists public.weekly_actions (
  id          uuid primary key default gen_random_uuid(),
  user_a      uuid not null references auth.users(id) on delete cascade,
  user_b      uuid references auth.users(id) on delete cascade,
  week_start  date not null,                      -- the Sunday the week begins
  action      text not null check (char_length(action) between 3 and 300),
  why         text check (char_length(why) <= 400),
  created_at  timestamptz not null default now(),
  check (user_b is null or user_a < user_b)
);
create unique index if not exists weekly_actions_pair_week
  on public.weekly_actions (user_a, coalesce(user_b, '00000000-0000-0000-0000-000000000000'::uuid), week_start);

create table if not exists public.weekly_checkins (
  action_id   uuid not null references public.weekly_actions(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  status      text not null check (status in ('done', 'not_yet', 'skipped')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (action_id, user_id)
);

alter table public.agent_settings  enable row level security;
alter table public.weekly_actions  enable row level security;
alter table public.weekly_checkins enable row level security;

drop policy if exists agent_settings_own on public.agent_settings;
create policy agent_settings_own on public.agent_settings for select to authenticated using (user_id = auth.uid());
-- The app saves your time zone quietly when it opens, so the weekly loop needs no setup
drop policy if exists agent_settings_own_insert on public.agent_settings;
drop policy if exists agent_settings_own_update on public.agent_settings;
create policy agent_settings_own_insert on public.agent_settings for insert to authenticated with check (user_id = auth.uid());
create policy agent_settings_own_update on public.agent_settings for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists weekly_actions_pair on public.weekly_actions;
create policy weekly_actions_pair on public.weekly_actions for select to authenticated
  using (auth.uid() in (user_a, user_b));

-- Both partners see each other's check-in on their shared action; each person writes only their own
drop policy if exists weekly_checkins_pair_read on public.weekly_checkins;
drop policy if exists weekly_checkins_own_write on public.weekly_checkins;
drop policy if exists weekly_checkins_own_update on public.weekly_checkins;
create policy weekly_checkins_pair_read on public.weekly_checkins for select to authenticated
  using (exists (select 1 from public.weekly_actions a where a.id = action_id and auth.uid() in (a.user_a, a.user_b)));
create policy weekly_checkins_own_write on public.weekly_checkins for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.weekly_actions a where a.id = action_id and auth.uid() in (a.user_a, a.user_b)));
create policy weekly_checkins_own_update on public.weekly_checkins for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke all on public.agent_settings, public.weekly_actions, public.weekly_checkins from anon;
revoke insert, update, delete on public.agent_settings, public.weekly_actions from authenticated;
grant insert (user_id, timezone, weekly_enabled, updated_at), update (user_id, timezone, weekly_enabled, updated_at) on public.agent_settings to authenticated;
revoke delete on public.weekly_checkins from authenticated;
revoke update on public.weekly_checkins from authenticated;
grant update (status, updated_at) on public.weekly_checkins to authenticated;

-- Belluh posts the Sunday insight and the Wednesday check-in at most once per person per week,
-- even if two runs of the job overlap
create unique index if not exists agent_messages_weekly_once
  on public.agent_messages (user_id, (meta->>'kind'), (meta->>'week'))
  where meta->>'kind' in ('weekly', 'checkin');

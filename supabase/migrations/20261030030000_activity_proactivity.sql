-- What Bella did, for the person to see: every tool she ran in their conversation and everything she did on her own
-- (a reminder sent, a watch found, an offer to plan). Read by its owner only; written only by Belluh's backend.
create table if not exists public.agent_activity (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  action      text not null check (char_length(action) between 2 and 40),   -- a tool name, or what Bella did on her own
  detail      text check (detail is null or char_length(detail) <= 200),     -- what it was about, in their words
  ok          boolean not null default true,
  channel     text check (channel is null or char_length(channel) <= 20),
  created_at  timestamptz not null default now()
);
create index if not exists agent_activity_recent on public.agent_activity (user_id, created_at desc);
alter table public.agent_activity enable row level security;
drop policy if exists agent_activity_own on public.agent_activity;
create policy agent_activity_own on public.agent_activity for select to authenticated using (user_id = auth.uid());
revoke all on public.agent_activity from anon;
revoke insert, update, delete on public.agent_activity from authenticated;

-- How often Bella reaches out on her own: quiet (only what you asked for), normal, or more
alter table public.agent_settings add column if not exists proactivity text not null default 'normal'
  check (proactivity in ('quiet', 'normal', 'more'));
grant insert (proactivity), update (proactivity) on public.agent_settings to authenticated;

-- A goal's action plan: the few steps Bella broke it into, each ticked off as it happens
alter table public.couple_goals add column if not exists steps jsonb not null default '[]'::jsonb
  check (jsonb_typeof(steps) = 'array' and jsonb_array_length(steps) <= 6);

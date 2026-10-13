-- Plan together: Belluh proposes a plan with a few times to one partner's partner; they pick one (or say none work).
-- Confirmed plans become saved dates (so reminders cover them) and appear in each person's calendar feed.

create table if not exists public.plans (
  id             uuid primary key default gen_random_uuid(),
  created_by     uuid not null references auth.users(id) on delete cascade,
  partner_id     uuid not null references auth.users(id) on delete cascade,
  title          text not null check (char_length(title) between 2 and 140),
  details        text check (char_length(details) <= 1000),
  -- [{ "id": "a", "starts_at": "2026-10-17T23:00:00Z", "minutes": 120, "label": "Saturday evening" }]
  options        jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 1 and 3),
  status         text not null default 'proposed' check (status in ('proposed', 'confirmed', 'declined', 'cancelled')),
  chosen_option  text,
  partner_note   text check (char_length(partner_note) <= 500),
  timezone       text not null default 'America/New_York',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check (created_by <> partner_id)
);
create index if not exists plans_people on public.plans (created_by, partner_id, status);

alter table public.plans enable row level security;
drop policy if exists plans_pair_read on public.plans;
create policy plans_pair_read on public.plans for select to authenticated using (auth.uid() in (created_by, partner_id));
revoke all on public.plans from anon;
revoke insert, update, delete on public.plans from authenticated;   -- only Belluh writes, after checking who you are

-- Belluh's thread can now hold plan cards
alter table public.agent_messages drop constraint if exists agent_messages_role_check;
alter table public.agent_messages add constraint agent_messages_role_check
  check (role in ('user', 'belluh', 'partner_note', 'note_draft', 'plan'));

-- A private, revocable calendar feed per person (subscribe once in Google, Apple or Outlook Calendar)
create table if not exists public.calendar_feeds (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  token       text not null unique,
  created_at  timestamptz not null default now()
);
alter table public.calendar_feeds enable row level security;
drop policy if exists calendar_feeds_own on public.calendar_feeds;
create policy calendar_feeds_own on public.calendar_feeds for select to authenticated using (user_id = auth.uid());
revoke all on public.calendar_feeds from anon;
revoke insert, update, delete on public.calendar_feeds from authenticated;

-- Returns your feed token, creating it the first time; pass reset => true to revoke the old link
create or replace function public.my_calendar_token(p_reset boolean default false) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare v text;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if p_reset then delete from public.calendar_feeds where user_id = auth.uid(); end if;
  select token into v from public.calendar_feeds where user_id = auth.uid();
  if v is null then
    v := translate(encode(gen_random_bytes(24), 'base64'), '+/=', '-_');
    insert into public.calendar_feeds (user_id, token) values (auth.uid(), v);
  end if;
  return v;
end $$;
revoke all on function public.my_calendar_token(boolean) from public, anon;
grant execute on function public.my_calendar_token(boolean) to authenticated;

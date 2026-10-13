-- Belluh remembers every date and occasion, captured over WhatsApp or in the app.
-- Server-side code (edge functions) uses the service role; the app only reads its own rows.

create extension if not exists pgcrypto;

-- Every date a user has told Belluh about
create table if not exists public.occasions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  label           text not null check (char_length(label) between 1 and 120),
  kind            text not null default 'other'
                    check (kind in ('birthday','anniversary','first_date','first_met','first_kiss','holiday','trip','other')),
  month           smallint not null check (month between 1 and 12),
  day             smallint not null check (day between 1 and 31),
  year            smallint check (year between 1900 and 2100),
  repeats_yearly  boolean not null default true,
  source          text not null default 'app' check (source in ('app','whatsapp')),
  source_message  text,                       -- the user's own words, as sent
  mentioned_at    timestamptz not null default now(),  -- when they first told Belluh
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create unique index if not exists occasions_user_label_date
  on public.occasions (user_id, lower(label), month, day);
create index if not exists occasions_user on public.occasions (user_id);

-- One WhatsApp number per user, linked by texting a one-time code
create table if not exists public.whatsapp_links (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  phone_e164         text unique,              -- set when the code is confirmed from WhatsApp
  link_code          text unique,
  link_code_expires  timestamptz,
  timezone           text not null default 'America/New_York',
  linked_at          timestamptz,
  last_inbound_at    timestamptz,              -- opens Meta's 24-hour free-reply window
  reminders_enabled  boolean not null default true,
  created_at         timestamptz not null default now()
);

-- Message log: idempotency for Meta's retries, and an audit trail for the user
create table if not exists public.whatsapp_messages (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete cascade,
  direction      text not null check (direction in ('in','out')),
  wa_message_id  text unique,
  phone_e164     text not null,
  body           text,
  created_at     timestamptz not null default now()
);
create index if not exists whatsapp_messages_user on public.whatsapp_messages (user_id, created_at desc);

-- One row per reminder sent, so the hourly job never sends twice
create table if not exists public.reminders_sent (
  occasion_id  uuid not null references public.occasions(id) on delete cascade,
  occurs_on    date not null,
  stage        text not null check (stage in ('week_before','day_of')),
  sent_at      timestamptz not null default now(),
  wa_message_id text,
  primary key (occasion_id, occurs_on, stage)
);

-- Row-level security: users see only their own rows
alter table public.occasions         enable row level security;
alter table public.whatsapp_links    enable row level security;
alter table public.whatsapp_messages enable row level security;
alter table public.reminders_sent    enable row level security;

drop policy if exists occasions_owner_select on public.occasions;
drop policy if exists occasions_owner_insert on public.occasions;
drop policy if exists occasions_owner_update on public.occasions;
drop policy if exists occasions_owner_delete on public.occasions;
create policy occasions_owner_select on public.occasions for select to authenticated using (user_id = auth.uid());
create policy occasions_owner_insert on public.occasions for insert to authenticated with check (user_id = auth.uid() and source = 'app');
create policy occasions_owner_update on public.occasions for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy occasions_owner_delete on public.occasions for delete to authenticated using (user_id = auth.uid());

drop policy if exists whatsapp_links_owner_select on public.whatsapp_links;
drop policy if exists whatsapp_links_owner_delete on public.whatsapp_links;
create policy whatsapp_links_owner_select on public.whatsapp_links for select to authenticated using (user_id = auth.uid());
create policy whatsapp_links_owner_delete on public.whatsapp_links for delete to authenticated using (user_id = auth.uid());

drop policy if exists whatsapp_messages_owner_select on public.whatsapp_messages;
create policy whatsapp_messages_owner_select on public.whatsapp_messages for select to authenticated using (user_id = auth.uid());
-- reminders_sent: no client policies; only the service role touches it.

revoke all on public.occasions, public.whatsapp_links, public.whatsapp_messages, public.reminders_sent from anon;
revoke insert, update on public.whatsapp_links from authenticated;
revoke insert, update, delete on public.whatsapp_messages, public.reminders_sent from authenticated;

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at := now(); return new; end $$;
drop trigger if exists occasions_touch on public.occasions;
create trigger occasions_touch before update on public.occasions
  for each row execute function public.touch_updated_at();

-- The app calls this to get a code; the user texts "LINK <code>" to Belluh on WhatsApp.
create or replace function public.request_whatsapp_link(p_timezone text default null)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_uid  uuid := auth.uid();
  v_code text;
begin
  if v_uid is null then
    raise exception 'not signed in';
  end if;
  -- 6 characters, no lookalikes (0/O, 1/I)
  v_code := (
    select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + (get_byte(b, i) % 32), 1), '')
    from (select gen_random_bytes(6) as b) r, generate_series(0, 5) i
  );
  insert into public.whatsapp_links (user_id, link_code, link_code_expires, timezone)
  values (v_uid, v_code, now() + interval '30 minutes', coalesce(nullif(p_timezone, ''), 'America/New_York'))
  on conflict (user_id) do update
    set link_code = excluded.link_code,
        link_code_expires = excluded.link_code_expires,
        timezone = coalesce(nullif(p_timezone, ''), public.whatsapp_links.timezone);
  return v_code;
end $$;

revoke all on function public.request_whatsapp_link(text) from public, anon;
grant execute on function public.request_whatsapp_link(text) to authenticated;

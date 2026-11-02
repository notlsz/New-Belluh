-- Belluh Memory (after Rollup): counts for the memory agent's rate limit and monthly token budget, and Our Passport.
-- Nothing here holds a question, a schema, a tool result, an answer, a photo or a device id. The passport table holds
-- only the text a person approved, with their choices of what their partner and Bella may see.

-- ---------- counts only ----------
create table if not exists public.memory_usage (
  user_id  uuid not null references auth.users(id) on delete cascade,
  period   text not null,              -- 'w:<5-minute window>' for steps, 'm:YYYY-MM' for the month
  steps    integer not null default 0,
  tokens   bigint  not null default 0,
  primary key (user_id, period)
);
alter table public.memory_usage enable row level security;
drop policy if exists memory_usage_own_select on public.memory_usage;
create policy memory_usage_own_select on public.memory_usage for select to authenticated using (user_id = auth.uid());
revoke all on public.memory_usage from anon;
revoke insert, update, delete on public.memory_usage from authenticated;
grant select on public.memory_usage to authenticated;

-- One agent step: counted in its 5-minute window and refused past the limit, or once the month's tokens are spent.
create or replace function public.memory_take_step(p_user uuid, p_steps integer, p_budget bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_window bigint := floor(extract(epoch from now()) / 300);
  v_month text := 'm:' || to_char(now() at time zone 'utc', 'YYYY-MM');
  v_steps integer; v_tokens bigint;
begin
  select tokens into v_tokens from public.memory_usage where user_id = p_user and period = v_month;
  if coalesce(v_tokens, 0) >= p_budget then
    return jsonb_build_object('ok', false, 'reason', 'quota',
      'reset', to_char((date_trunc('month', now() at time zone 'utc') + interval '1 month')::date, 'YYYY-MM-DD'));
  end if;
  insert into public.memory_usage (user_id, period, steps) values (p_user, 'w:' || v_window, 1)
  on conflict (user_id, period) do update set steps = public.memory_usage.steps + 1
  returning steps into v_steps;
  insert into public.memory_usage (user_id, period, steps) values (p_user, v_month, 1)
  on conflict (user_id, period) do update set steps = public.memory_usage.steps + 1;
  -- Old windows go as new ones come
  delete from public.memory_usage where user_id = p_user and period like 'w:%' and period <> 'w:' || v_window;
  if v_steps > p_steps then
    return jsonb_build_object('ok', false, 'reason', 'rate', 'retry_after', 300 - (extract(epoch from now())::bigint % 300));
  end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.memory_add_tokens(p_user uuid, p_tokens bigint)
returns void language sql security definer set search_path = public as $$
  insert into public.memory_usage (user_id, period, tokens) values (p_user, 'm:' || to_char(now() at time zone 'utc', 'YYYY-MM'), greatest(p_tokens, 0))
  on conflict (user_id, period) do update set tokens = public.memory_usage.tokens + greatest(p_tokens, 0);
$$;
revoke all on function public.memory_take_step(uuid, integer, bigint) from public, anon, authenticated;
revoke all on function public.memory_add_tokens(uuid, bigint) from public, anon, authenticated;

-- ---------- Our Passport: only the approved text ----------
create table if not exists public.memory_passports (
  user_id       uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  title         text check (char_length(title) <= 120),
  sections      jsonb not null default '{}'::jsonb check (octet_length(sections::text) < 16000),
  share_partner jsonb not null default '{}'::jsonb,   -- { music: true, food: false, ... }
  share_bella   jsonb not null default '{}'::jsonb,
  updated_at    timestamptz not null default now()
);
alter table public.memory_passports enable row level security;
drop policy if exists memory_passports_own on public.memory_passports;
create policy memory_passports_own on public.memory_passports for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.memory_passports from anon;
grant select, insert, update, delete on public.memory_passports to authenticated;

-- When the partner or Bella read a passport: who, which sections, when. The owner reads it in Activity.
create table if not exists public.passport_activity (
  id         bigint generated always as identity primary key,
  owner_id   uuid not null references auth.users(id) on delete cascade,
  actor      text not null check (actor in ('partner', 'bella')),
  channel    text check (char_length(channel) <= 20),
  sections   text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists passport_activity_owner on public.passport_activity (owner_id, created_at desc);
alter table public.passport_activity enable row level security;
drop policy if exists passport_activity_own_select on public.passport_activity;
create policy passport_activity_own_select on public.passport_activity for select to authenticated using (owner_id = auth.uid());
drop policy if exists passport_activity_own_delete on public.passport_activity;
create policy passport_activity_own_delete on public.passport_activity for delete to authenticated using (owner_id = auth.uid());
revoke all on public.passport_activity from anon;
revoke insert, update on public.passport_activity from authenticated;
grant select, delete on public.passport_activity to authenticated;

-- The partner's passport, only the sections they share with you; the read is noted in their Activity (once an hour).
create or replace function public.partner_passport()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid(); v_partner uuid; v_row public.memory_passports; v_out jsonb := '{}'::jsonb; v_keys text[] := '{}'; k text;
begin
  if v_me is null then return null; end if;
  select case when user_id = v_me then partner_id else user_id end into v_partner
    from public.partner_connections where status = 'connected' and (user_id = v_me or partner_id = v_me)
    order by created_at asc limit 1;
  if v_partner is null then return null; end if;
  select * into v_row from public.memory_passports where user_id = v_partner;
  if not found then return null; end if;
  for k in select key from jsonb_each(v_row.sections) loop
    if coalesce((v_row.share_partner ->> k)::boolean, false) then
      v_out := v_out || jsonb_build_object(k, v_row.sections -> k);
      v_keys := v_keys || k;
    end if;
  end loop;
  if array_length(v_keys, 1) is null then return jsonb_build_object('user_id', v_partner, 'sections', '{}'::jsonb); end if;
  if not exists (select 1 from public.passport_activity where owner_id = v_partner and actor = 'partner' and created_at > now() - interval '1 hour') then
    insert into public.passport_activity (owner_id, actor, channel, sections) values (v_partner, 'partner', 'app', v_keys);
  end if;
  return jsonb_build_object('user_id', v_partner, 'title', v_row.title, 'sections', v_out, 'updated_at', v_row.updated_at);
end $$;
revoke all on function public.partner_passport() from public, anon;
grant execute on function public.partner_passport() to authenticated;

notify pgrst, 'reload schema';

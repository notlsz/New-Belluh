-- Fixes from the independent security audit (Oct 13, 2026). Safe to re-run.
--  1. Invite links work once: a removed partner can't reconnect with an old link.
--  2. Nobody can hand an entry to someone else (forged entries, reading a partner's private files).
--  3. Profile emails always match the login email; invites by email only find confirmed accounts.
--  4. Strangers can't read your profile by sending you a request or tagging you in a circle.
--  5. Bad time zones can't break reminders or the weekly loop.
--  6. AI limits fail closed and have a site-wide hourly cap.
--  7. are_partners only answers about yourself.
--  8. Analytics and conflict logs: owner-only (admin reads analytics); journal-media storage locked down.

-- ---------- 1. one-time invite links ----------

create or replace function public.accept_partner_invite(p_token text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_inv public.partner_invites%rowtype;
begin
  if v_me is null then raise exception 'not signed in'; end if;
  select * into v_inv from public.partner_invites where token = p_token for update;
  if not found or v_inv.expires_at < now() then raise exception 'invite not found or expired'; end if;
  if v_inv.inviter = v_me then raise exception 'cannot accept your own invite'; end if;
  if v_inv.used_by is not null then
    -- A second tap by the same person is fine while they're still connected; anything else is a reused link
    if v_inv.used_by = v_me and public.are_partners(v_inv.inviter, v_me) then return v_inv.inviter; end if;
    raise exception 'invite already used';
  end if;

  update public.partner_connections set status = 'connected'
   where (user_id = v_inv.inviter and partner_id = v_me) or (user_id = v_me and partner_id = v_inv.inviter);
  if not found then
    insert into public.partner_connections (user_id, partner_id, status) values (v_inv.inviter, v_me, 'connected');
  end if;
  update public.partner_invites set used_by = v_me, used_at = now() where token = p_token;
  return v_inv.inviter;
end $$;
revoke all on function public.accept_partner_invite(text) from public, anon;
grant execute on function public.accept_partner_invite(text) to authenticated;

-- When a couple disconnects, the links between the two of them are removed too.
-- (Only for real connections, and only that pair's links, so nobody can wipe someone else's invites.)
create or replace function public.expire_invites_on_disconnect() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.status = 'connected' then
    delete from public.partner_invites
     where (inviter = old.user_id and used_by = old.partner_id) or (inviter = old.partner_id and used_by = old.user_id);
  end if;
  return old;
end $$;
drop trigger if exists expire_invites_on_disconnect on public.partner_connections;
create trigger expire_invites_on_disconnect after delete on public.partner_connections
  for each row execute function public.expire_invites_on_disconnect();

-- ---------- 2. entries can't change owner ----------

create or replace function public.journal_partner_edit_guard() returns trigger
language plpgsql as $$
begin
  if new.user_id is distinct from old.user_id then
    raise exception 'an entry cannot change owner';
  end if;
  if auth.uid() is not null and auth.uid() <> old.user_id then
    if (to_jsonb(new) - 'is_favorite' - 'updated_at') is distinct from (to_jsonb(old) - 'is_favorite' - 'updated_at') then
      raise exception 'partners can only like an entry, not change it';
    end if;
  end if;
  return new;
end $$;

-- ---------- 3. profile email = login email ----------

create or replace function public.profiles_sync_email() returns trigger
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is not null then
    new.email := (select u.email from auth.users u where u.id = new.id);
  end if;
  return new;
end $$;
drop trigger if exists profiles_sync_email on public.profiles;
create trigger profiles_sync_email before insert or update on public.profiles
  for each row execute function public.profiles_sync_email();

create or replace function public.find_user_by_email(p_email text) returns uuid
language sql stable security definer set search_path = public, auth as $$
  select u.id from auth.users u
  join public.profiles p on p.id = u.id
  where auth.uid() is not null
    and length(trim(coalesce(p_email, ''))) between 3 and 254
    and lower(u.email) = lower(trim(p_email))
    and u.email_confirmed_at is not null
  order by u.created_at
  limit 1;
$$;
revoke all on function public.find_user_by_email(text) from public, anon;
grant execute on function public.find_user_by_email(text) to authenticated;

-- ---------- 4. who can see a profile ----------
-- You, your connected partner, someone who sent YOU a request, and anyone who added you to their circle.

create or replace function public.can_see_profile(p_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (
    p_id = auth.uid()
    or exists (select 1 from public.partner_connections c
               where (c.status = 'connected' and ((c.user_id = auth.uid() and c.partner_id = p_id) or (c.user_id = p_id and c.partner_id = auth.uid())))
                  or (c.status = 'pending' and c.user_id = p_id and c.partner_id = auth.uid()))
    or exists (select 1 from public.journal_entries je
               where 'system_circle_member' = any(je.tags) and ('member:' || auth.uid()::text) = any(je.tags)
                 and je.user_id = p_id)
  );
$$;

-- ---------- 5. time zones are always valid ----------

create or replace function public.normalize_timezone() returns trigger
language plpgsql as $$
begin
  if new.timezone is null or new.timezone in ('Factory', 'localtime', 'posixrules')
     or not exists (select 1 from pg_timezone_names where name = new.timezone) then
    new.timezone := 'America/New_York';
  end if;
  return new;
end $$;
drop trigger if exists normalize_timezone on public.agent_settings;
create trigger normalize_timezone before insert or update on public.agent_settings
  for each row execute function public.normalize_timezone();
drop trigger if exists normalize_timezone on public.whatsapp_links;
create trigger normalize_timezone before insert or update on public.whatsapp_links
  for each row execute function public.normalize_timezone();
update public.agent_settings set timezone = timezone;  -- fix any bad values already stored
update public.whatsapp_links set timezone = timezone;

-- ---------- 6. AI limits: fail closed, plus a site-wide cap ----------

create table if not exists public.ai_usage_global (
  kind   text not null,
  hour   timestamptz not null,
  calls  integer not null default 0,
  primary key (kind, hour)
);
alter table public.ai_usage_global enable row level security;
revoke all on public.ai_usage_global from anon, authenticated;

drop function if exists public.ai_take_call(uuid, integer, text);
create or replace function public.ai_take_call(p_user uuid, p_limit integer, p_kind text default 'proxy', p_global_limit integer default 3000)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_mine integer; v_all integer;
begin
  insert into public.ai_usage (user_id, kind, hour, calls) values (p_user, p_kind, date_trunc('hour', now()), 1)
  on conflict (user_id, kind, hour) do update set calls = public.ai_usage.calls + 1
  returning calls into v_mine;
  insert into public.ai_usage_global (kind, hour, calls) values (p_kind, date_trunc('hour', now()), 1)
  on conflict (kind, hour) do update set calls = public.ai_usage_global.calls + 1
  returning calls into v_all;
  return v_mine <= p_limit and v_all <= p_global_limit;
end $$;
revoke all on function public.ai_take_call(uuid, integer, text, integer) from public, anon, authenticated;

-- ---------- 7. are_partners only answers about yourself ----------
-- Still callable inside access rules (they always pass auth.uid()); returns false for questions about other people.

create or replace function public.are_partners(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select (auth.uid() is null or auth.uid() in (a, b)) and exists (
    select 1 from public.partner_connections
    where status = 'connected'
      and ((user_id = a and partner_id = b) or (user_id = b and partner_id = a))
  );
$$;

-- ---------- 8. tables and storage defined outside these migrations ----------

create or replace function pg_temp.drop_policies(t text) returns void language plpgsql as $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
    execute format('drop policy if exists %I on public.%I', p.policyname, t);
  end loop;
end $$;

do $$
begin
  -- Analytics: you write your own events; only the admin reads them
  if to_regclass('public.analytics_events') is not null
     and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'analytics_events' and column_name = 'user_id') then
    alter table public.analytics_events enable row level security;
    perform pg_temp.drop_policies('analytics_events');
    revoke all on public.analytics_events from anon;
    execute $p$create policy analytics_insert_own on public.analytics_events for insert to authenticated with check (user_id = auth.uid())$p$;
    execute $p$create policy analytics_admin_read on public.analytics_events for select to authenticated using (auth.uid() = 'd95a25a6-e873-41d1-80ef-26258d3ff3b7'::uuid)$p$;
    revoke update, delete on public.analytics_events from authenticated;
  end if;
  -- Conflict logs hold the raw text of arguments: owner only
  if to_regclass('public.conflict_logs') is not null
     and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'conflict_logs' and column_name = 'user_id') then
    alter table public.conflict_logs enable row level security;
    perform pg_temp.drop_policies('conflict_logs');
    revoke all on public.conflict_logs from anon;
    execute $p$create policy conflict_logs_insert_own on public.conflict_logs for insert to authenticated with check (user_id = auth.uid())$p$;
    execute $p$create policy conflict_logs_read_own on public.conflict_logs for select to authenticated using (user_id = auth.uid())$p$;
    revoke update, delete on public.conflict_logs from authenticated;
  end if;
end $$;

-- Storage: replace every older rule on storage.objects with the minimal set Belluh needs.
-- journal-private rules come from the security hardening migration; they are recreated here so the set is complete.
do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname = 'storage' and tablename = 'objects' loop
    begin
      execute format('drop policy if exists %I on storage.objects', p.policyname);
    exception when insufficient_privilege then
      raise warning 'could not drop storage policy %, remove it in the dashboard', p.policyname;
    end;
  end loop;
end $$;

create policy jp_owner_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'journal-private' and (storage.foldername(name))[1] = auth.uid()::text);
create policy jp_owner_or_partner_read on storage.objects for select to authenticated
  using (bucket_id = 'journal-private' and public.can_read_private_media(name));
create policy jp_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'journal-private' and (storage.foldername(name))[1] = auth.uid()::text);
-- journal-media (public): only profile photos can be added now, each under your own id; no listing, no overwriting
create policy jm_avatar_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'journal-media' and name like 'avatars/' || auth.uid()::text || '-%');
create policy jm_avatar_delete on storage.objects for delete to authenticated
  using (bucket_id = 'journal-media' and name like 'avatars/' || auth.uid()::text || '-%');

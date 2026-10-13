-- Security hardening for Belluh.
--  1. Invite links use one-time tokens; nobody can attach themselves to an account by guessing its ID.
--  2. Email lookup is an exact match through a function (no wildcard search over everyone's emails).
--  3. Row-level security on journal entries and partner connections, replacing whatever policies existed.
--  4. A private storage bucket for voice notes and photos, readable only by the owner and their partner.
--  5. Per-user AI rate limiting for the server-side Gemini proxy.
-- Safe to re-run.

create extension if not exists pgcrypto;

-- ---------- helpers ----------

-- True when the two users have an accepted connection, in either direction
create or replace function public.are_partners(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.partner_connections
    where status = 'connected'
      and ((user_id = a and partner_id = b) or (user_id = b and partner_id = a))
  );
$$;
revoke all on function public.are_partners(uuid, uuid) from public, anon;
grant execute on function public.are_partners(uuid, uuid) to authenticated;

-- Drops every existing policy on a table, so the policies below are the complete set
create or replace function pg_temp.drop_policies(t text) returns void language plpgsql as $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
    execute format('drop policy if exists %I on public.%I', p.policyname, t);
  end loop;
end $$;

-- ---------- 1. invite tokens ----------

create table if not exists public.partner_invites (
  token       text primary key,
  inviter     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '14 days',
  used_by     uuid references auth.users(id) on delete set null,
  used_at     timestamptz
);
alter table public.partner_invites enable row level security;
select pg_temp.drop_policies('partner_invites');
create policy partner_invites_owner_select on public.partner_invites for select to authenticated using (inviter = auth.uid());
revoke all on public.partner_invites from anon;
revoke insert, update, delete on public.partner_invites from authenticated;

create or replace function public.create_partner_invite() returns text
language plpgsql security definer set search_path = public, extensions as $$
declare v_token text;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  v_token := translate(encode(gen_random_bytes(18), 'base64'), '+/=', '-_');
  insert into public.partner_invites (token, inviter) values (v_token, auth.uid());
  return v_token;
end $$;

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
  if v_inv.used_by is not null and v_inv.used_by <> v_me then raise exception 'invite already used'; end if;

  -- Both people chose this: the inviter made the link, the invitee opened it while signed in
  update public.partner_connections set status = 'connected'
   where (user_id = v_inv.inviter and partner_id = v_me) or (user_id = v_me and partner_id = v_inv.inviter);
  if not found then
    insert into public.partner_connections (user_id, partner_id, status) values (v_inv.inviter, v_me, 'connected');
  end if;
  update public.partner_invites set used_by = v_me, used_at = now() where token = p_token;
  return v_inv.inviter;
end $$;

-- Lets the person who opened a link see who sent it, before they agree to connect
create or replace function public.preview_partner_invite(p_token text) returns text
language sql stable security definer set search_path = public as $$
  select coalesce(nullif(split_part(trim(p.full_name), ' ', 1), ''), 'Someone')
  from public.partner_invites i join public.profiles p on p.id = i.inviter
  where auth.uid() is not null and i.token = p_token and i.expires_at > now()
    and (i.used_by is null or i.used_by = auth.uid()) and i.inviter <> auth.uid();
$$;
revoke all on function public.preview_partner_invite(text) from public, anon;
grant execute on function public.preview_partner_invite(text) to authenticated;

revoke all on function public.create_partner_invite() from public, anon;
revoke all on function public.accept_partner_invite(text) from public, anon;
grant execute on function public.create_partner_invite() to authenticated;
grant execute on function public.accept_partner_invite(text) to authenticated;

-- ---------- 2. exact email lookup ----------

create or replace function public.find_user_by_email(p_email text) returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.profiles
  where auth.uid() is not null
    and length(trim(coalesce(p_email, ''))) between 3 and 254
    and lower(email) = lower(trim(p_email))
  limit 1;
$$;
revoke all on function public.find_user_by_email(text) from public, anon;
grant execute on function public.find_user_by_email(text) to authenticated;

-- ---------- 3a. partner connections ----------

alter table public.partner_connections enable row level security;
select pg_temp.drop_policies('partner_connections');
create policy pc_parties_select on public.partner_connections for select to authenticated
  using (auth.uid() in (user_id, partner_id));
-- You can only send a request from yourself, and only as pending
create policy pc_request_insert on public.partner_connections for insert to authenticated
  with check (user_id = auth.uid() and partner_id <> auth.uid() and status = 'pending');
-- Only the person who received the request can accept it
create policy pc_recipient_accept on public.partner_connections for update to authenticated
  using (partner_id = auth.uid() and status = 'pending')
  with check (partner_id = auth.uid() and status = 'connected');
create policy pc_parties_delete on public.partner_connections for delete to authenticated
  using (auth.uid() in (user_id, partner_id));
revoke all on public.partner_connections from anon;
revoke update on public.partner_connections from authenticated;
grant update (status) on public.partner_connections to authenticated;

-- ---------- 3b. journal entries ----------

alter table public.journal_entries enable row level security;
select pg_temp.drop_policies('journal_entries');
create policy je_read on public.journal_entries for select to authenticated
  using (user_id = auth.uid() or (is_shared is true and public.are_partners(auth.uid(), user_id)));
create policy je_insert_own on public.journal_entries for insert to authenticated
  with check (user_id = auth.uid());
-- Owners edit their entries; a connected partner may only toggle the heart on a shared entry (enforced by trigger)
create policy je_update on public.journal_entries for update to authenticated
  using (user_id = auth.uid() or (is_shared is true and public.are_partners(auth.uid(), user_id)))
  with check (user_id = auth.uid() or (is_shared is true and public.are_partners(auth.uid(), user_id)));
create policy je_delete_own on public.journal_entries for delete to authenticated
  using (user_id = auth.uid());
revoke all on public.journal_entries from anon;

create or replace function public.journal_partner_edit_guard() returns trigger
language plpgsql as $$
begin
  if auth.uid() is not null and auth.uid() <> old.user_id then
    if (to_jsonb(new) - 'is_favorite' - 'updated_at') is distinct from (to_jsonb(old) - 'is_favorite' - 'updated_at') then
      raise exception 'partners can only like an entry, not change it';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists journal_partner_edit_guard on public.journal_entries;
create trigger journal_partner_edit_guard before update on public.journal_entries
  for each row execute function public.journal_partner_edit_guard();

-- Admin dashboard counts without reading anyone's writing
create or replace function public.admin_entry_stats()
returns table (id uuid, user_id uuid, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select je.id, je.user_id, je.created_at from public.journal_entries je
  where auth.uid() = 'd95a25a6-e873-41d1-80ef-26258d3ff3b7'::uuid;
$$;
revoke all on function public.admin_entry_stats() from public, anon;
grant execute on function public.admin_entry_stats() to authenticated;

-- ---------- 4. private media ----------
-- Files live at <owner id>/voice/... and <owner id>/photos/... ; the app stores "sb://journal-private/<path>"
-- and turns it into a short-lived signed URL when it loads entries.

insert into storage.buckets (id, name, public)
values ('journal-private', 'journal-private', false)
on conflict (id) do update set public = false;

drop policy if exists jp_owner_insert on storage.objects;
drop policy if exists jp_owner_or_partner_read on storage.objects;
drop policy if exists jp_owner_delete on storage.objects;
create policy jp_owner_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'journal-private' and (storage.foldername(name))[1] = auth.uid()::text);
-- A partner can open a file only if it is attached to an entry its owner shared
create or replace function public.can_read_private_media(p_name text) returns boolean
language sql stable security definer set search_path = public, storage as $$
  select case
    when (storage.foldername(p_name))[1] = auth.uid()::text then true
    else exists (
      select 1 from public.journal_entries je
      where je.user_id::text = (storage.foldername(p_name))[1]
        and je.is_shared is true
        and ('sb://journal-private/' || p_name) in (je.audio_url, je.photo_url)
        and public.are_partners(auth.uid(), je.user_id)
    )
  end;
$$;
revoke all on function public.can_read_private_media(text) from public, anon;
grant execute on function public.can_read_private_media(text) to authenticated;

create policy jp_owner_or_partner_read on storage.objects for select to authenticated
  using (bucket_id = 'journal-private' and public.can_read_private_media(name));
create policy jp_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'journal-private' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- 5. AI rate limiting ----------

create table if not exists public.ai_usage (
  user_id  uuid not null references auth.users(id) on delete cascade,
  hour     timestamptz not null,
  calls    integer not null default 0,
  primary key (user_id, hour)
);
alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon, authenticated;

-- Counts a call and says whether the user is still under the hourly limit (service role only)
create or replace function public.ai_take_call(p_user uuid, p_limit integer) returns boolean
language sql security definer set search_path = public as $$
  insert into public.ai_usage (user_id, hour, calls) values (p_user, date_trunc('hour', now()), 1)
  on conflict (user_id, hour) do update set calls = public.ai_usage.calls + 1
  returning calls <= p_limit;
$$;
revoke all on function public.ai_take_call(uuid, integer) from public, anon, authenticated;

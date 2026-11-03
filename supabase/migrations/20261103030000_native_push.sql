-- Notifications for the iOS and Android apps: each phone a person turns notifications on for gets a row with its
-- APNs device token (iOS) or FCM registration token (Android). The server sends with Belluh's APNs key and Firebase
-- service account (supabase/functions/_shared/nativepush.ts); the client never sees those.

create table if not exists public.native_push_tokens (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  platform     text not null check (platform in ('ios', 'android')),
  token        text not null unique check (char_length(token) between 20 and 4096),
  -- iOS only: which APNs a token belongs to (debug builds use the sandbox); found on the first send
  environment  text check (environment in ('production', 'sandbox')),
  app_version  text check (char_length(app_version) < 40),
  created_at   timestamptz not null default now(),
  last_ok_at   timestamptz
);
create index if not exists native_push_tokens_user on public.native_push_tokens (user_id);
alter table public.native_push_tokens enable row level security;
drop policy if exists native_push_own_select on public.native_push_tokens;
drop policy if exists native_push_own_delete on public.native_push_tokens;
create policy native_push_own_select on public.native_push_tokens for select to authenticated using (user_id = auth.uid());
create policy native_push_own_delete on public.native_push_tokens for delete to authenticated using (user_id = auth.uid());
revoke all on public.native_push_tokens from anon;
revoke insert, update on public.native_push_tokens from authenticated;

-- A phone's token belongs to whoever is signed in on it now: registering moves it from a previous account on the
-- same phone, so a shared phone never gets someone else's notifications.
create or replace function public.register_native_push(p_platform text, p_token text, p_app_version text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if p_platform not in ('ios', 'android') then raise exception 'bad platform'; end if;
  if p_token is null or char_length(p_token) < 20 or char_length(p_token) > 4096 then raise exception 'bad token'; end if;
  delete from public.native_push_tokens where token = p_token and user_id <> auth.uid();
  -- At most ten phones per person: the oldest goes first
  delete from public.native_push_tokens where id in (
    select id from public.native_push_tokens where user_id = auth.uid() and token <> p_token order by created_at desc offset 9
  );
  insert into public.native_push_tokens (user_id, platform, token, app_version)
  values (auth.uid(), p_platform, p_token, left(p_app_version, 39))
  on conflict (token) do update set user_id = excluded.user_id, platform = excluded.platform, app_version = excluded.app_version;
end;
$$;
revoke all on function public.register_native_push(text, text, text) from public, anon;
grant execute on function public.register_native_push(text, text, text) to authenticated;

-- Minimal Supabase-like base: roles, auth, storage, and Belluh's existing tables (as the app uses them)
do $$ begin
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role nologin bypassrls; end if;
  if not exists (select 1 from pg_roles where rolname='authenticator') then create role authenticator login noinherit password 'auth'; end if;
end $$;
grant anon, authenticated, service_role to authenticator;
create schema auth; create schema extensions; create schema storage;
create extension pgcrypto schema extensions;
create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz default now(), created_at timestamptz default now());
create function auth.uid() returns uuid language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''), (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'))::uuid $$;
create table storage.buckets (id text primary key, name text, public boolean);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as $$ select string_to_array(name, '/') $$;
grant usage on schema public, auth, extensions, storage to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;

create table public.profiles (id uuid primary key references auth.users(id), email text, full_name text, partner_name text, avatar_url text, journal_streak int default 0);
create table public.partner_connections (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id), partner_id uuid references auth.users(id), status text, created_at timestamptz default now(), unique (user_id, partner_id));
create table public.journal_entries (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id), content text, title text, mood text, type text, is_shared boolean, is_favorite boolean default false, tags text[], audio_url text, photo_url text, date timestamptz, created_at timestamptz default now());
-- The kind of wide-open rules we suspect exist today; the migration must replace them
alter table public.profiles enable row level security; create policy "Public profiles" on public.profiles for select using (true);
alter table public.journal_entries enable row level security; create policy "Anyone" on public.journal_entries for all using (true) with check (true);
alter table public.partner_connections enable row level security; create policy "Anyone" on public.partner_connections for all using (true) with check (true);
create table public.analytics_events (id uuid primary key default gen_random_uuid(), user_id uuid, event_name text, properties jsonb, created_at timestamptz default now());
create table public.conflict_logs (id uuid primary key default gen_random_uuid(), user_id uuid, original_input text, ai_suggestion text, sentiment_score real, created_at timestamptz default now());
create policy "Anyone storage" on storage.objects for all using (true) with check (true);

insert into auth.users values
 ('11111111-1111-1111-1111-111111111111','maya@test.com'),
 ('22222222-2222-2222-2222-222222222222','dan@test.com'),
 ('33333333-3333-3333-3333-333333333333','eve@test.com');
insert into public.profiles (id, email, full_name) values
 ('11111111-1111-1111-1111-111111111111','maya@test.com','Maya Chen'),
 ('22222222-2222-2222-2222-222222222222','dan@test.com','Dan Reyes'),
 ('33333333-3333-3333-3333-333333333333','eve@test.com','Eve Stranger');

-- Privacy choices (GDPR consent, CCPA/CPRA "sale or sharing" opt out, Global Privacy Control), one row per person,
-- so a choice made on one device follows them to the next. Written by the app (src/lib/consent.ts).

create table if not exists public.privacy_consent (
  user_id     uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  consent     jsonb not null check (octet_length(consent::text) < 8000),
  updated_at  timestamptz default now()
);

alter table public.privacy_consent enable row level security;

drop policy if exists privacy_consent_own_select on public.privacy_consent;
create policy privacy_consent_own_select on public.privacy_consent for select to authenticated
  using (user_id = auth.uid());
drop policy if exists privacy_consent_own_insert on public.privacy_consent;
create policy privacy_consent_own_insert on public.privacy_consent for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists privacy_consent_own_update on public.privacy_consent;
create policy privacy_consent_own_update on public.privacy_consent for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists privacy_consent_own_delete on public.privacy_consent;
create policy privacy_consent_own_delete on public.privacy_consent for delete to authenticated
  using (user_id = auth.uid());

revoke all on public.privacy_consent from anon;
grant select, insert, update, delete on public.privacy_consent to authenticated;

notify pgrst, 'reload schema';

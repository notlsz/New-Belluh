-- How each person's profile looks, after amo: banner, background, colors, avatar effect, stickers placed anywhere, and
-- blocks (music, books, photos, voice notes, words, links) they arrange themselves. One JSON per person; they write
-- their own, and their partner can read it.
create table if not exists public.profile_looks (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  look jsonb not null default '{}'::jsonb check (octet_length(look::text) < 200000),
  updated_at timestamptz not null default now()
);
alter table public.profile_looks enable row level security;
drop policy if exists "look read" on public.profile_looks;
create policy "look read" on public.profile_looks for select to authenticated
  using (user_id = auth.uid() or public.are_partners(auth.uid(), user_id));
drop policy if exists "look write" on public.profile_looks;
create policy "look write" on public.profile_looks for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.profile_looks to authenticated;
notify pgrst, 'reload schema';

-- Guides a couple makes together (travel, food, bars, countries they've been to, anything) and shares: just the two of
-- them, anyone with the link, or everyone on Belluh. Link-only guides are read through guide_by_slug, so nobody can list
-- them; only public ones can be browsed.
create table if not exists public.guides (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  emoji text not null default '🗺️' check (char_length(emoji) <= 16),
  kind text not null default 'travel' check (kind in ('travel', 'food', 'bars', 'countries', 'other')),
  description text check (char_length(description) <= 600),
  visibility text not null default 'us' check (visibility in ('us', 'link', 'public')),
  author_name text check (char_length(author_name) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.guide_places (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references public.guides(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  kind text not null default 'place' check (kind in ('place', 'country')),
  country text check (char_length(country) <= 80),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  emoji text check (char_length(emoji) <= 16),
  note text check (char_length(note) <= 400),
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists guides_user_idx on public.guides(user_id);
create index if not exists guides_public_idx on public.guides(visibility, updated_at desc);
create index if not exists guide_places_guide_idx on public.guide_places(guide_id, sort);

alter table public.guides enable row level security;
alter table public.guide_places enable row level security;

drop policy if exists "guides public read" on public.guides;
create policy "guides public read" on public.guides for select to anon, authenticated using (visibility = 'public');
drop policy if exists "guides ours" on public.guides;
create policy "guides ours" on public.guides for all to authenticated
  using (user_id = auth.uid() or public.are_partners(auth.uid(), user_id))
  with check (user_id = auth.uid() or public.are_partners(auth.uid(), user_id));

drop policy if exists "guide places public read" on public.guide_places;
create policy "guide places public read" on public.guide_places for select to anon, authenticated
  using (exists (select 1 from public.guides g where g.id = guide_id and g.visibility = 'public'));
drop policy if exists "guide places ours" on public.guide_places;
create policy "guide places ours" on public.guide_places for all to authenticated
  using (exists (select 1 from public.guides g where g.id = guide_id and (g.user_id = auth.uid() or public.are_partners(auth.uid(), g.user_id))))
  with check (exists (select 1 from public.guides g where g.id = guide_id and (g.user_id = auth.uid() or public.are_partners(auth.uid(), g.user_id))));

grant select on public.guides, public.guide_places to anon;
grant select, insert, update, delete on public.guides, public.guide_places to authenticated;

-- A shared guide by its link: public or link-only, with its places. Never returns a guide kept to the two of you.
create or replace function public.guide_by_slug(s text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', g.id, 'slug', g.slug, 'title', g.title, 'emoji', g.emoji, 'kind', g.kind, 'description', g.description,
    'visibility', g.visibility, 'author_name', g.author_name, 'updated_at', g.updated_at,
    'places', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name, 'kind', p.kind, 'country', p.country,
      'lat', p.lat, 'lng', p.lng, 'emoji', p.emoji, 'note', p.note) order by p.sort, p.created_at) from public.guide_places p where p.guide_id = g.id), '[]'::jsonb))
  from public.guides g where g.slug = s and g.visibility in ('link', 'public');
$$;
revoke all on function public.guide_by_slug(text) from public;
grant execute on function public.guide_by_slug(text) to anon, authenticated;

create or replace function public.touch_guide() returns trigger language plpgsql set search_path = public as $$
begin update public.guides set updated_at = now() where id = coalesce(new.guide_id, old.guide_id); return null; end $$;
drop trigger if exists guide_places_touch on public.guide_places;
create trigger guide_places_touch after insert or update or delete on public.guide_places for each row execute function public.touch_guide();

-- The two of you's guides, whatever their visibility
create or replace function public.our_guides() returns setof public.guides
language sql stable set search_path = public as $$
  select * from public.guides where user_id = auth.uid() or public.are_partners(auth.uid(), user_id);
$$;
grant execute on function public.our_guides() to authenticated;

notify pgrst, 'reload schema';

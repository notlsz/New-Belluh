-- What Belluh gets ready (a table, a trip, flowers, a gift, dinner, tickets) and whether they did it. Once they tap
-- "I booked it", it goes in the calendar, gets a reminder, is remembered, and Belluh asks how it went afterwards.
-- Flowers and gifts are surprises: the partner never sees them.

create table if not exists public.bookings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  partner_id  uuid references auth.users(id) on delete set null,
  kind        text not null check (kind in ('table', 'trip', 'flowers', 'gift', 'dinner', 'experience')),
  title       text not null check (char_length(title) between 2 and 160),
  starts_at   timestamptz,
  ends_at     timestamptz,
  all_day     boolean not null default false,
  place       text check (char_length(place) <= 160),
  url         text check (url is null or (url ~ '^https://' and char_length(url) <= 2000)),
  surprise    boolean not null default false,
  status      text not null default 'prepared' check (status in ('prepared', 'booked', 'dismissed')),
  message_id  uuid,
  booked_at   timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists bookings_owner on public.bookings (user_id, status, starts_at);
create index if not exists bookings_partner on public.bookings (partner_id, status, starts_at);

alter table public.bookings enable row level security;
drop policy if exists bookings_read on public.bookings;
-- Your own, always; your partner's once booked, unless it's a surprise for you
create policy bookings_read on public.bookings for select to authenticated
  using (user_id = auth.uid() or (partner_id = auth.uid() and status = 'booked' and not surprise));
revoke all on public.bookings from anon;
revoke insert, update, delete on public.bookings from authenticated;   -- only Belluh writes, after checking who you are

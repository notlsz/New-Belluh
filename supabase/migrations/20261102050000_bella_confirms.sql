-- Bella confirms bookings herself: a table once the restaurant says yes on her call, an order once the shop confirms
-- it (its order webhook, or the checkout coming back completed). What she confirmed (who, the reference, the party
-- size, the delivery day) is kept on the booking. Where nothing can come back on its own (a link to an outside site),
-- the "I booked it" tap stays and Bella asks once whether it went through; the answer is kept too.

alter table public.bookings add column if not exists confirm_via text check (confirm_via in ('call', 'checkout', 'ask'));
alter table public.bookings add column if not exists confirmed_by text check (confirmed_by in ('bella', 'person'));
alter table public.bookings add column if not exists confirm_ref text check (char_length(confirm_ref) <= 60);
alter table public.bookings add column if not exists delivery_on date;
alter table public.bookings add column if not exists follow_up_at timestamptz;
alter table public.bookings add column if not exists follow_up_answer text check (follow_up_answer in ('yes', 'not_yet', 'no'));
create index if not exists bookings_follow_up on public.bookings (status, created_at) where status = 'prepared' and follow_up_at is null;

-- The shop checkout behind an order: only the person who got it ready can see it (never their partner, since orders
-- are often surprises), and only Belluh writes it.
create table if not exists public.booking_orders (
  booking_id  uuid primary key references public.bookings(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  checkout_id text not null check (char_length(checkout_id) between 1 and 200),
  shop        text not null check (shop ~ '^[A-Za-z0-9.-]{3,200}$'),
  total_cents integer check (total_cents is null or total_cents > 0),
  seller      text check (char_length(seller) <= 60),
  order_id    text check (char_length(order_id) <= 120),
  checked_at  timestamptz,
  created_at  timestamptz not null default now()
);
create unique index if not exists booking_orders_checkout on public.booking_orders (checkout_id);
create index if not exists booking_orders_open on public.booking_orders (created_at) where order_id is null;

alter table public.booking_orders enable row level security;
drop policy if exists booking_orders_read on public.booking_orders;
create policy booking_orders_read on public.booking_orders for select to authenticated using (user_id = auth.uid());
revoke all on public.booking_orders from anon;
revoke insert, update, delete on public.booking_orders from authenticated;

-- Each signed order event once (shops retry): service only, nobody reads it from the app
create table if not exists public.order_events (
  webhook_id  text primary key check (char_length(webhook_id) between 1 and 200),
  received_at timestamptz not null default now()
);
alter table public.order_events enable row level security;
revoke all on public.order_events from anon, authenticated;

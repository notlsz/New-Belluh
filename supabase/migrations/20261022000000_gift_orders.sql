-- Gifts given from the landing page: a year of Duo for a couple, with a note, and optionally a card in the mail.
-- Only the backend reads or writes these (no policies, so signed-in users and anon can't). The mailing address is
-- cleared once the card has shipped.
create table if not exists public.gift_orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'requested' check (status in ('requested', 'paid', 'sent', 'redeemed', 'cancelled')),
  partner_one text not null check (char_length(partner_one) between 1 and 60),
  partner_two text not null check (char_length(partner_two) between 1 and 60),
  recipient_email text not null check (char_length(recipient_email) <= 200),
  giver_name text not null check (char_length(giver_name) between 1 and 60),
  giver_email text not null check (char_length(giver_email) <= 200),
  occasion text not null check (char_length(occasion) <= 40),
  note text not null check (char_length(note) <= 200),
  delivery text not null check (delivery in ('email', 'card_to_them', 'card_to_giver')),
  mailing_address text check (mailing_address is null or char_length(mailing_address) <= 240),
  deliver_on date,
  price_cents int not null default 8888,
  ip_hash text
);
create index if not exists gift_orders_ip_recent on public.gift_orders (ip_hash, created_at desc);
alter table public.gift_orders enable row level security;
revoke all on public.gift_orders from anon, authenticated;

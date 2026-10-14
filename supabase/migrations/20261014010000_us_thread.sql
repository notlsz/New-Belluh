-- "Us": one conversation for the couple and Belluh together. Both partners read it; only Belluh's server
-- writes it (so every message is tied to a real, connected pair).

create table if not exists public.us_messages (
  id          uuid primary key default gen_random_uuid(),
  user_a      uuid not null references auth.users(id) on delete cascade,
  user_b      uuid not null references auth.users(id) on delete cascade,
  author      uuid references auth.users(id) on delete set null,   -- null means Belluh
  role        text not null check (role in ('user', 'belluh', 'plan')),
  body        text not null check (char_length(body) between 1 and 4000),
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  check (user_a < user_b)
);
create index if not exists us_messages_pair on public.us_messages (user_a, user_b, created_at desc);

alter table public.us_messages enable row level security;
drop policy if exists us_messages_pair_select on public.us_messages;
create policy us_messages_pair_select on public.us_messages for select to authenticated using (
  auth.uid() in (user_a, user_b)
  and exists (
    select 1 from public.partner_connections c
    where c.status = 'connected'
      and ((c.user_id = user_a and c.partner_id = user_b) or (c.user_id = user_b and c.partner_id = user_a))
  )
);
revoke all on public.us_messages from anon;
revoke insert, update, delete on public.us_messages from authenticated;

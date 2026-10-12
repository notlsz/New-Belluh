-- Belluh agent: one ongoing thread per person, things Belluh remembers, and notes Belluh carries between partners.
-- The edge function (service role) writes; the app reads its own rows and can forget memories.

create table if not exists public.agent_messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null check (role in ('user','belluh','partner_note','note_draft')),
  body        text not null check (char_length(body) <= 8000),
  meta        jsonb not null default '{}'::jsonb,   -- e.g. {"from_name":"Maya"} or {"entry_id":"..."}
  created_at  timestamptz not null default now()
);
create index if not exists agent_messages_thread on public.agent_messages (user_id, created_at desc);

-- Facts Belluh keeps about you and your relationship. You can see and delete every one.
create table if not exists public.agent_memories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  fact        text not null check (char_length(fact) between 1 and 300),
  created_at  timestamptz not null default now()
);
create index if not exists agent_memories_user on public.agent_memories (user_id, created_at desc);
create unique index if not exists agent_memories_dedupe on public.agent_memories (user_id, lower(fact));

-- Notes one partner approved for Belluh to pass on
create table if not exists public.partner_notes (
  id           uuid primary key default gen_random_uuid(),
  from_user    uuid not null references auth.users(id) on delete cascade,
  to_user      uuid not null references auth.users(id) on delete cascade,
  body         text not null check (char_length(body) between 1 and 1000),
  created_at   timestamptz not null default now(),
  read_at      timestamptz,
  check (from_user <> to_user)
);
create index if not exists partner_notes_to on public.partner_notes (to_user, created_at desc);

alter table public.agent_messages enable row level security;
alter table public.agent_memories enable row level security;
alter table public.partner_notes  enable row level security;

drop policy if exists agent_messages_owner_select on public.agent_messages;
create policy agent_messages_owner_select on public.agent_messages for select to authenticated using (user_id = auth.uid());

drop policy if exists agent_memories_owner_select on public.agent_memories;
drop policy if exists agent_memories_owner_delete on public.agent_memories;
create policy agent_memories_owner_select on public.agent_memories for select to authenticated using (user_id = auth.uid());
create policy agent_memories_owner_delete on public.agent_memories for delete to authenticated using (user_id = auth.uid());

drop policy if exists partner_notes_parties_select on public.partner_notes;
drop policy if exists partner_notes_recipient_update on public.partner_notes;
create policy partner_notes_parties_select on public.partner_notes for select to authenticated
  using (from_user = auth.uid() or to_user = auth.uid());
create policy partner_notes_recipient_update on public.partner_notes for update to authenticated
  using (to_user = auth.uid()) with check (to_user = auth.uid());

revoke all on public.agent_messages, public.agent_memories, public.partner_notes from anon;
revoke insert, update, delete on public.agent_messages from authenticated;
revoke insert, update on public.agent_memories from authenticated;
revoke insert, delete on public.partner_notes from authenticated;
revoke update on public.partner_notes from authenticated;
grant update (read_at) on public.partner_notes to authenticated;

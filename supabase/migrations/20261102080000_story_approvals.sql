-- Bring your story from the app you met on: the partner's words wait for the partner's yes.
--
-- When a person imports how they met (from a dating app's data export or screenshots, read on their device), the lines
-- that may be the partner's words are held here instead of in the journal. Only the partner can approve or decline;
-- an approval writes one shared (or private, as the owner chose) journal entry in the owner's name, and a decline forgets
-- the words. The owner sees what is waiting and can withdraw it. Which dating app it was is never a column: it is only in
-- the entry's tags, and only when the person chose to name it.

create table if not exists public.story_approvals (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  -- Null until known: then whoever is connected to the owner as their partner decides
  partner_id  uuid references auth.users(id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 120),
  lines       text[] not null default '{}' check (cardinality(lines) <= 12),
  day         date not null,
  is_shared   boolean not null default true,
  tags        text[] not null default '{}' check (cardinality(tags) <= 6),
  status      text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  entry_id    uuid,
  created_at  timestamptz not null default now(),
  decided_at  timestamptz
);
create index if not exists story_approvals_owner on public.story_approvals (owner_id, status);
create index if not exists story_approvals_partner on public.story_approvals (partner_id, status);

alter table public.story_approvals enable row level security;
drop policy if exists sa_read on public.story_approvals;
drop policy if exists sa_insert_own on public.story_approvals;
drop policy if exists sa_withdraw_own on public.story_approvals;
-- The owner, the named partner, or (while unnamed) the owner's connected partner
create policy sa_read on public.story_approvals for select to authenticated
  using (owner_id = auth.uid() or partner_id = auth.uid() or (partner_id is null and public.are_partners(auth.uid(), owner_id)));
-- Only your own, only pending, and a named partner must really be your partner
create policy sa_insert_own on public.story_approvals for insert to authenticated
  with check (owner_id = auth.uid() and status = 'pending' and decided_at is null and entry_id is null
              and (partner_id is null or public.are_partners(auth.uid(), partner_id))
              and not ('system_facts' = any(tags)) and not ('system_circle_def' = any(tags)));
-- The owner may withdraw a pending one; nobody updates rows directly (decisions go through the function below)
create policy sa_withdraw_own on public.story_approvals for delete to authenticated
  using (owner_id = auth.uid() and status = 'pending');
revoke all on public.story_approvals from anon;
revoke update on public.story_approvals from authenticated;

-- The partner decides. Approve: the lines become one journal entry in the owner's name. Decline: the words are forgotten.
create or replace function public.decide_story_approval(p_id uuid, p_approve boolean) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  a public.story_approvals;
  v_me uuid := auth.uid();
  v_entry uuid;
begin
  if v_me is null then raise exception 'sign in first'; end if;
  select * into a from public.story_approvals where id = p_id for update;
  if not found or a.status <> 'pending' then raise exception 'nothing to decide'; end if;
  if v_me = a.owner_id then raise exception 'only your partner can approve their words'; end if;
  if not public.are_partners(v_me, a.owner_id) or (a.partner_id is not null and a.partner_id <> v_me) then
    raise exception 'not yours to decide';
  end if;
  if p_approve then
    -- The day goes in as an untyped literal, so it fits the journal's date column whatever its type
    execute format('insert into public.journal_entries (user_id, content, title, type, is_shared, date, tags)
                    values ($1, $2, $3, %L, $4, %L, $5) returning id', 'Milestone', to_char(a.day, 'YYYY-MM-DD') || 'T12:00:00.000Z')
      into v_entry
      using a.owner_id, (select string_agg('“' || l || '”', E'\n\n') from unnest(a.lines) as l), a.title, a.is_shared,
            array_append(a.tags, 'partner_approved');
    update public.story_approvals set status = 'approved', partner_id = v_me, decided_at = now(), entry_id = v_entry where id = p_id;
  else
    update public.story_approvals set status = 'declined', partner_id = v_me, decided_at = now(), lines = '{}' where id = p_id;
  end if;
  return v_entry;
end $$;
revoke all on function public.decide_story_approval(uuid, boolean) from public, anon;
grant execute on function public.decide_story_approval(uuid, boolean) to authenticated;

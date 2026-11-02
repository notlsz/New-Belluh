-- Couple metrics for the admin dashboard: who is connected to whom, and since when. Ids and dates only, never content.
create or replace function public.admin_couple_stats()
returns table (user_id uuid, partner_id uuid, connected_at timestamptz)
language sql stable security definer set search_path = public as $$
  select c.user_id, c.partner_id, nullif(to_jsonb(c)->>'created_at', '')::timestamptz
  from public.partner_connections c
  where c.status = 'connected' and auth.uid() = 'd95a25a6-e873-41d1-80ef-26258d3ff3b7'::uuid;
$$;
revoke all on function public.admin_couple_stats() from public, anon;
grant execute on function public.admin_couple_stats() to authenticated;
